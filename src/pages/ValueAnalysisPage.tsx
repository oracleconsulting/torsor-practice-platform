import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  DollarSign, 
  Shield, 
  Users, 
  Zap,
  Download,
  ArrowRight,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAssessmentProgress } from '@/hooks/useAssessmentProgress';
import { supabase } from '@/lib/supabase/client';
import { motion } from 'framer-motion';

interface AssetScore {
  category: string;
  score: number;
  maxScore: number;
  issues: string[];
  opportunities: string[];
  financialImpact: number;
}

interface ValueGap {
  area: string;
  currentValue: number;
  potentialValue: number;
  gap: number;
  actions: string[];
  timeframe: string;
  effort: 'Low' | 'Medium' | 'High';
}

interface RiskItem {
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  impact: string;
  mitigation: string;
  cost: number;
}

export const ValueAnalysisPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { progress } = useAssessmentProgress();
  
  const [loading, setLoading] = useState(true);
  const [valueAnalysis, setValueAnalysis] = useState<any>(null);
  const [assetScores, setAssetScores] = useState<AssetScore[]>([]);
  const [valueGaps, setValueGaps] = useState<ValueGap[]>([]);
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [actionPlan, setActionPlan] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    loadValueAnalysis();
  }, [progress?.group_id]);
  
  const loadValueAnalysis = async () => {
    if (!progress?.group_id) return;
    
    try {
      console.log('[ValueAnalysisPage] Loading value analysis for group:', progress.group_id);
      
      const { data, error } = await supabase
        .from('client_intake_part2')
        .select('value_analysis_data, asset_scores, value_gaps, risk_register, action_plan, value_analysis_generated')
        .eq('group_id', progress.group_id)
        .single();
      
      console.log('[ValueAnalysisPage] Raw data from database:', data);
      
      if (data) {
        // First try to get data from value_analysis_data (the full object)
        if (data.value_analysis_data && typeof data.value_analysis_data === 'object') {
          console.log('[ValueAnalysisPage] Using value_analysis_data:', data.value_analysis_data);
          setValueAnalysis(data.value_analysis_data);
          
          // Extract components from the full analysis data
          setAssetScores(data.value_analysis_data.asset_scores || []);
          setValueGaps(data.value_analysis_data.value_gaps || []);
          setRisks(data.value_analysis_data.risk_register || data.value_analysis_data.risk_assessment?.risks || []);
          setActionPlan(data.value_analysis_data.action_plan || {});
        } else {
          // Fallback to separate columns
          console.log('[ValueAnalysisPage] Using separate columns');
          setValueAnalysis(data.value_analysis_data);
          setAssetScores(data.asset_scores || []);
          setValueGaps(data.value_gaps || []);
          setRisks(data.risk_register || []);
          setActionPlan(data.action_plan);
        }
        
        console.log('[ValueAnalysisPage] Processed data:', {
          hasValueAnalysis: !!data.value_analysis_data,
          assetScoresCount: data.asset_scores?.length || 0,
          valueGapsCount: data.value_gaps?.length || 0,
          risksCount: data.risk_register?.length || 0,
          hasActionPlan: !!data.action_plan,
          valueAnalysisGenerated: data.value_analysis_generated
        });
      } else {
        console.log('[ValueAnalysisPage] No data found');
      }
    } catch (error) {
      console.error('[ValueAnalysisPage] Error loading value analysis:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'text-red-600 bg-red-50';
      case 'High': return 'text-orange-600 bg-orange-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'Low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };
  
  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'Low': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'High': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-oracle-purple" />
      </div>
    );
  }
  
  const totalPotentialValue = valueGaps.reduce((sum, gap) => sum + gap.gap, 0);
  const criticalRisks = risks.filter(r => r.severity === 'Critical').length;
  const quickWins = valueGaps.filter(g => g.effort === 'Low' && g.gap > 10000).length;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-oracle-navy mb-2">Hidden Value Analysis</h1>
            <p className="text-gray-600">Your comprehensive business value assessment</p>
          </motion.div>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-oracle-purple/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Value Gap</p>
                      <p className="text-2xl font-bold text-oracle-purple">
                        £{totalPotentialValue.toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-oracle-purple/20" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-red-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Critical Risks</p>
                      <p className="text-2xl font-bold text-red-600">{criticalRisks}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-200" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Quick Wins</p>
                      <p className="text-2xl font-bold text-green-600">{quickWins}</p>
                    </div>
                    <Zap className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-oracle-gold/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Exit Readiness</p>
                      <p className="text-2xl font-bold text-oracle-gold">
                        {Math.round((assetScores.reduce((sum, s) => sum + s.score, 0) / 
                          assetScores.reduce((sum, s) => sum + s.maxScore, 0)) * 100)}%
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-oracle-gold/20" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          
          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="assets">Asset Scores</TabsTrigger>
              <TabsTrigger value="gaps">Value Gaps</TabsTrigger>
              <TabsTrigger value="risks">Risk Register</TabsTrigger>
              <TabsTrigger value="actions">Action Plan</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Executive Summary</CardTitle>
                  <CardDescription>Key findings from your Hidden Value Audit</CardDescription>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-oracle-navy mb-3">Top Opportunities</h3>
                      <ul className="space-y-2">
                        {valueGaps.slice(0, 3).map((gap, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                            <div>
                              <span className="font-medium">{gap.area}:</span> £{gap.gap.toLocaleString()} potential
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-oracle-navy mb-3">Critical Issues</h3>
                      <ul className="space-y-2">
                        {risks.filter(r => r.severity === 'Critical').slice(0, 3).map((risk, index) => (
                          <li key={index} className="flex items-start">
                            <XCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                            <div>
                              <span className="font-medium">{risk.title}:</span> {risk.impact}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Business Valuation Impact</CardTitle>
                  <CardDescription>How addressing these issues affects your business value</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Current Estimated Value</span>
                        <span className="text-sm text-gray-600">Based on industry multiples</span>
                      </div>
                      <div className="bg-gray-100 rounded-lg p-4">
                        <p className="text-2xl font-bold text-gray-700">£2.4M</p>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Potential Value (12-18 months)</span>
                        <span className="text-sm text-gray-600">After implementing recommendations</span>
                      </div>
                      <div className="bg-oracle-purple/10 rounded-lg p-4">
                        <p className="text-2xl font-bold text-oracle-purple">£3.8M</p>
                        <p className="text-sm text-oracle-purple/70 mt-1">+58% increase</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="assets" className="space-y-6">
              {assetScores.map((asset, index) => (
                <motion.div
                  key={asset.category}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">{asset.category}</CardTitle>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-oracle-purple">
                            {asset.score}/{asset.maxScore}
                          </p>
                          <p className="text-sm text-gray-600">
                            {Math.round((asset.score / asset.maxScore) * 100)}%
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Progress 
                        value={(asset.score / asset.maxScore) * 100} 
                        className="mb-4"
                      />
                      
                      {asset.issues.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-sm mb-2 text-red-600">Issues Found:</h4>
                          <ul className="space-y-1">
                            {asset.issues.map((issue, i) => (
                              <li key={i} className="text-sm text-gray-600 flex items-start">
                                <span className="text-red-400 mr-2">•</span>
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {asset.opportunities.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-2 text-green-600">Opportunities:</h4>
                          <ul className="space-y-1">
                            {asset.opportunities.map((opp, i) => (
                              <li key={i} className="text-sm text-gray-600 flex items-start">
                                <span className="text-green-400 mr-2">•</span>
                                {opp}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-gray-600">
                          Financial Impact: <span className="font-semibold text-oracle-purple">
                            £{asset.financialImpact.toLocaleString()}/year
                          </span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </TabsContent>
            
            <TabsContent value="gaps" className="space-y-4">
              {valueGaps.map((gap, index) => (
                <motion.div
                  key={gap.area}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{gap.area}</h3>
                          <p className="text-sm text-gray-600">
                            Effort: <span className={`font-medium ${getEffortColor(gap.effort)}`}>
                              {gap.effort}
                            </span> • Timeframe: {gap.timeframe}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-oracle-purple">
                            £{gap.gap.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">potential value</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Actions Required:</p>
                        <ul className="space-y-1">
                          {gap.actions.map((action, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start">
                              <ArrowRight className="h-4 w-4 text-oracle-purple mr-2 mt-0.5" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </TabsContent>
            
            <TabsContent value="risks" className="space-y-4">
              {risks.map((risk, index) => (
                <motion.div
                  key={risk.title}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`border-l-4 ${
                    risk.severity === 'Critical' ? 'border-l-red-500' :
                    risk.severity === 'High' ? 'border-l-orange-500' :
                    risk.severity === 'Medium' ? 'border-l-yellow-500' :
                    'border-l-green-500'
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-lg">{risk.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(risk.severity)}`}>
                          {risk.severity}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">
                        <span className="font-medium">Impact:</span> {risk.impact}
                      </p>
                      
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Mitigation Strategy:</p>
                        <p className="text-sm text-gray-600">{risk.mitigation}</p>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-3">
                        Estimated cost to fix: <span className="font-semibold">
                          £{risk.cost.toLocaleString()}
                        </span>
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </TabsContent>
            
            <TabsContent value="actions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>90-Day Action Plan</CardTitle>
                  <CardDescription>Your prioritized roadmap to unlock hidden value</CardDescription>
                </CardHeader>
                <CardContent>
                  {actionPlan ? (
                    <div className="space-y-6">
                      {actionPlan.quick_wins && actionPlan.quick_wins.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-lg mb-3 text-oracle-navy">
                            Quick Wins (Week 1-2)
                          </h3>
                          <div className="space-y-2">
                            {actionPlan.quick_wins.map((win: any, index: number) => (
                              <div key={index} className="flex items-start p-3 bg-green-50 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                                <div className="flex-1">
                                  <p className="font-medium">{win.area}</p>
                                  <p className="text-sm text-gray-600">
                                    {win.actions.join(', ')}
                                  </p>
                                  <p className="text-sm text-green-600 mt-1">
                                    Impact: £{win.gap.toLocaleString()} potential value
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {actionPlan.critical_fixes && actionPlan.critical_fixes.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-lg mb-3 text-oracle-navy">
                            Critical Fixes (Week 3-4)
                          </h3>
                          <div className="space-y-2">
                            {actionPlan.critical_fixes.map((fix: any, index: number) => (
                              <div key={index} className="flex items-start p-3 bg-red-50 rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
                                <div className="flex-1">
                                  <p className="font-medium">{fix.title}</p>
                                  <p className="text-sm text-gray-600">
                                    {fix.mitigation}
                                  </p>
                                  <p className="text-sm text-red-600 mt-1">
                                    Cost: £{fix.cost.toLocaleString()} to fix
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {actionPlan.strategic_initiatives && actionPlan.strategic_initiatives.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-lg mb-3 text-oracle-navy">
                            Strategic Initiatives (Week 5-12)
                          </h3>
                          <div className="space-y-2">
                            {actionPlan.strategic_initiatives.map((initiative: any, index: number) => (
                              <div key={index} className="flex items-start p-3 bg-purple-50 rounded-lg">
                                <Shield className="h-5 w-5 text-purple-600 mr-3 mt-0.5" />
                                <div className="flex-1">
                                  <p className="font-medium">{initiative.area}</p>
                                  <p className="text-sm text-gray-600">
                                    {initiative.actions.join(', ')}
                                  </p>
                                  <p className="text-sm text-purple-600 mt-1">
                                    Impact: £{initiative.gap.toLocaleString()} potential value
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="bg-oracle-purple/5 p-4 rounded-lg">
                        <h4 className="font-semibold text-oracle-navy mb-2">Summary</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Total Actions:</p>
                            <p className="font-semibold">{actionPlan.total_actions || 0}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Estimated Impact:</p>
                            <p className="font-semibold text-oracle-purple">
                              £{(actionPlan.estimated_impact || 0).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Time Requirement:</p>
                            <p className="font-semibold">{actionPlan.time_requirement || '10-15 hours/week'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600">Action plan is being generated...</p>
                    </div>
                  )}
                  
                  <div className="mt-8 flex justify-between items-center">
                    <Button variant="outline" size="lg">
                      <Download className="h-4 w-4 mr-2" />
                      Download Full Report
                    </Button>
                    
                    <Button 
                      size="lg"
                      className="bg-oracle-gold hover:bg-oracle-gold/90 text-oracle-navy font-semibold"
                      onClick={() => navigate('/dashboard')}
                    >
                      Return to Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ValueAnalysisPage; 