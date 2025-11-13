/**
 * Retention Risk Dashboard
 * 
 * Displays flight risk predictions for all team members
 * Provides actionable insights for retention management
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Shield,
  Clock,
  Target,
  Loader2,
  RefreshCw
} from 'lucide-react';
import {
  calculatePracticeRetentionRisks,
  getPracticeRetentionSummary,
  type RetentionRiskResult
} from '@/services/risk-analytics/retention-risk';

export default function RetentionRiskDashboard() {
  const [loading, setLoading] = useState(true);
  const [risks, setRisks] = useState<RetentionRiskResult[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selectedMember, setSelectedMember] = useState<RetentionRiskResult | null>(null);

  useEffect(() => {
    loadRetentionRisks();
  }, []);

  const loadRetentionRisks = async () => {
    setLoading(true);
    try {
      const practiceId = 'a1b2c3d4-5678-90ab-cdef-123456789abc';
      
      const [risksData, summaryData] = await Promise.all([
        calculatePracticeRetentionRisks(practiceId),
        getPracticeRetentionSummary(practiceId)
      ]);

      setRisks(risksData);
      setSummary(summaryData);
    } catch (error) {
      console.error('[RetentionDashboard] Error loading risks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Critical': return 'bg-red-100 text-red-900 border-red-300';
      case 'High': return 'bg-orange-100 text-orange-900 border-orange-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-900 border-yellow-300';
      case 'Low': return 'bg-green-100 text-green-900 border-green-300';
      default: return 'bg-gray-100 text-gray-900 border-gray-300';
    }
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'Critical': return 'bg-red-600';
      case 'High': return 'bg-orange-600';
      case 'Medium': return 'bg-yellow-600';
      case 'Low': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Immediate': return 'bg-red-100 text-red-900';
      case 'Short-term': return 'bg-orange-100 text-orange-900';
      case 'Medium-term': return 'bg-blue-100 text-blue-900';
      default: return 'bg-gray-100 text-gray-900';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Calculating retention risks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-600" />
            Retention Risk Management
          </h1>
          <p className="text-gray-600 mt-1">
            Predictive analytics for team retention using existing assessment data
          </p>
        </div>
        <Button onClick={loadRetentionRisks} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Members</p>
                  <p className="text-3xl font-bold">{summary.totalMembers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700">Critical Risk</p>
                  <p className="text-3xl font-bold text-red-900">{summary.criticalRisk}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-700">High Risk</p>
                  <p className="text-3xl font-bold text-orange-900">{summary.highRisk}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-700">Medium Risk</p>
                  <p className="text-3xl font-bold text-yellow-900">{summary.mediumRisk}</p>
                </div>
                <Target className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700">Low Risk</p>
                  <p className="text-3xl font-bold text-green-900">{summary.lowRisk}</p>
                </div>
                <Shield className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Critical/High Risk Alerts */}
      {summary && (summary.criticalRisk > 0 || summary.highRisk > 0) && (
        <Alert className="border-red-300 bg-red-50">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <AlertDescription className="text-red-900">
            <strong>Urgent Action Required:</strong> {summary.criticalRisk} team member{summary.criticalRisk !== 1 ? 's' : ''} at critical flight risk, 
            {summary.highRisk} at high risk. Review recommended actions immediately.
          </AlertDescription>
        </Alert>
      )}

      {/* Risk List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Member Retention Risks</CardTitle>
          <CardDescription>
            Ranked by flight risk score (highest risk first)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {risks.map((risk) => (
              <div
                key={risk.memberId}
                className={`p-4 rounded-lg border-2 cursor-pointer hover:shadow-lg transition-shadow ${getRiskColor(risk.riskLevel)}`}
                onClick={() => setSelectedMember(risk)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">{risk.memberName}</h3>
                      <Badge className={getRiskBadgeColor(risk.riskLevel)}>
                        {risk.riskLevel} Risk
                      </Badge>
                      <Badge variant="outline">
                        {risk.riskScore}/100
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {risk.timeToAction}
                      </Badge>
                    </div>

                    {/* Risk Factors */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                      {risk.topRiskFactors.map((factor, idx) => (
                        <div key={idx} className="bg-white bg-opacity-60 p-2 rounded">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{factor.factor}</span>
                            <span className="text-sm font-bold">{Math.round(factor.score)}</span>
                          </div>
                          <Progress value={factor.score} className="h-1.5" />
                          <p className="text-xs text-gray-600 mt-1">{factor.description}</p>
                        </div>
                      ))}
                    </div>

                    {/* Quick Actions Preview */}
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      {risk.recommendedActions.slice(0, 2).map((action, idx) => (
                        <Badge key={idx} className={getPriorityColor(action.priority)}>
                          {action.action}
                        </Badge>
                      ))}
                      {risk.recommendedActions.length > 2 && (
                        <span className="text-sm text-gray-600">
                          +{risk.recommendedActions.length - 2} more actions
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Risk Score Gauge */}
                  <div className="ml-4 text-center">
                    <div className="relative w-24 h-24">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-gray-200"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${risk.riskScore * 2.51} ${251 - risk.riskScore * 2.51}`}
                          className={
                            risk.riskLevel === 'Critical' ? 'text-red-600' :
                            risk.riskLevel === 'High' ? 'text-orange-600' :
                            risk.riskLevel === 'Medium' ? 'text-yellow-600' :
                            'text-green-600'
                          }
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold">{risk.riskScore}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Risk Score</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed View Modal */}
      {selectedMember && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedMember(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedMember.memberName}</h2>
                  <p className="text-gray-600">Retention Risk Analysis</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getRiskBadgeColor(selectedMember.riskLevel)}>
                    {selectedMember.riskLevel} Risk
                  </Badge>
                  <Badge variant="outline">{selectedMember.riskScore}/100</Badge>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedMember(null)}>
                    ✕
                  </Button>
                </div>
              </div>

              {/* Time to Action Alert */}
              <Alert className={
                selectedMember.riskLevel === 'Critical' || selectedMember.riskLevel === 'High'
                  ? 'border-red-300 bg-red-50'
                  : 'border-yellow-300 bg-yellow-50'
              }>
                <Clock className="w-5 h-5" />
                <AlertDescription>
                  <strong>{selectedMember.timeToAction}</strong>
                </AlertDescription>
              </Alert>

              {/* Risk Factors */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Risk Factors</h3>
                <div className="space-y-3">
                  {selectedMember.topRiskFactors.map((factor, idx) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{factor.factor}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            Weight: {Math.round(factor.weight * 100)}%
                          </span>
                          <span className="font-bold">{Math.round(factor.score)}/100</span>
                        </div>
                      </div>
                      <Progress value={factor.score} className="h-2 mb-2" />
                      <p className="text-sm text-gray-700">{factor.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Actions */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Recommended Actions</h3>
                <div className="space-y-3">
                  {selectedMember.recommendedActions.map((action, idx) => (
                    <div key={idx} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{action.action}</h4>
                            <Badge className={getPriorityColor(action.priority)}>
                              {action.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700">{action.description}</p>
                        </div>
                        <div className="ml-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">{action.expectedImpact}%</div>
                          <p className="text-xs text-gray-600">Impact</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confidence Level */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Prediction Confidence</span>
                  <div className="flex items-center gap-2">
                    <Progress value={selectedMember.confidence} className="w-32 h-2" />
                    <span className="font-bold">{selectedMember.confidence}%</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Based on completeness of assessment data
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

