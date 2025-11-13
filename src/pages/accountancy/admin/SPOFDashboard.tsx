/**
 * Single Point of Failure (SPOF) Dashboard
 * 
 * Visual alert system for business continuity risks
 * Shows which critical skills are held by only one person
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  Users,
  Shield,
  CheckCircle,
  Loader2,
  RefreshCw,
  FileText,
  UserPlus,
  GraduationCap,
  Clock
} from 'lucide-react';
import {
  analyzeSinglePointsOfFailure,
  generateMitigationPlan,
  getSPOFExecutiveSummary,
  type SinglePointFailure,
  type TeamRedundancyAnalysis
} from '@/services/risk-analytics/spof-detection';

export default function SPOFDashboard() {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<TeamRedundancyAnalysis | null>(null);
  const [selectedSPOF, setSelectedSPOF] = useState<SinglePointFailure | null>(null);
  const [executiveSummary, setExecutiveSummary] = useState<any>(null);

  useEffect(() => {
    loadAnalysis();
  }, []);

  const loadAnalysis = async () => {
    setLoading(true);
    try {
      const practiceId = 'a1b2c3d4-5678-90ab-cdef-123456789abc';
      
      const [analysisData, summaryData] = await Promise.all([
        analyzeSinglePointsOfFailure(practiceId),
        getSPOFExecutiveSummary(practiceId)
      ]);

      setAnalysis(analysisData);
      setExecutiveSummary(summaryData);
    } catch (error) {
      console.error('[SPOF Dashboard] Error loading analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Critical': return 'bg-red-100 text-red-900 border-red-300';
      case 'High': return 'bg-orange-100 text-orange-900 border-orange-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-900 border-yellow-300';
      case 'Watch': return 'bg-blue-100 text-blue-900 border-blue-300';
      default: return 'bg-gray-100 text-gray-900 border-gray-300';
    }
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'Critical': return 'bg-red-600';
      case 'High': return 'bg-orange-600';
      case 'Medium': return 'bg-yellow-600';
      case 'Watch': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  const getBusinessContinuityColor = (risk: string) => {
    switch (risk) {
      case 'Critical': return 'text-red-600';
      case 'High': return 'text-orange-600';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Analyzing single points of failure...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="border-red-300 bg-red-50">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <AlertDescription className="text-red-900">
            Unable to load SPOF analysis. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
            Single Point of Failure Detection
          </h1>
          <p className="text-gray-600 mt-1">
            Business continuity risk analysis - critical skills held by only one person
          </p>
        </div>
        <Button onClick={loadAnalysis} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Executive Alert */}
      {analysis.businessContinuityRisk === 'Critical' && (
        <Alert className="border-red-300 bg-red-50">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <AlertDescription className="text-red-900">
            <strong>CRITICAL BUSINESS RISK:</strong> {analysis.criticalSPOFs} mission-critical skill{analysis.criticalSPOFs !== 1 ? 's' : ''} held by single individuals. 
            Loss of these team members would severely impact client delivery. Immediate action required.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700">Critical SPOFs</p>
                <p className="text-3xl font-bold text-red-900">{analysis.criticalSPOFs}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700">High Risk SPOFs</p>
                <p className="text-3xl font-bold text-orange-900">{analysis.highSPOFs}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700">Vulnerable (2 people)</p>
                <p className="text-3xl font-bold text-yellow-900">{analysis.vulnerableSkills}</p>
              </div>
              <Users className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Healthy (3+ people)</p>
                <p className="text-3xl font-bold text-green-900">{analysis.healthySkills}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Redundancy Score</p>
                <p className={`text-3xl font-bold ${
                  analysis.overallRedundancyScore >= 80 ? 'text-green-600' :
                  analysis.overallRedundancyScore >= 60 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {analysis.overallRedundancyScore}
                </p>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Continuity Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Business Continuity Risk Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-medium">Overall Risk Level:</span>
            <Badge className={`text-lg px-4 py-2 ${
              analysis.businessContinuityRisk === 'Critical' ? 'bg-red-600' :
              analysis.businessContinuityRisk === 'High' ? 'bg-orange-600' :
              analysis.businessContinuityRisk === 'Medium' ? 'bg-yellow-600' :
              'bg-green-600'
            }`}>
              {analysis.businessContinuityRisk}
            </Badge>
          </div>
          <Progress 
            value={analysis.overallRedundancyScore} 
            className="h-4 mb-2"
          />
          <p className="text-sm text-gray-600">
            {analysis.overallRedundancyScore >= 80 && 'Excellent redundancy across critical skills. Continue monitoring.'}
            {analysis.overallRedundancyScore >= 60 && analysis.overallRedundancyScore < 80 && 'Good coverage but some gaps exist. Proactive mitigation recommended.'}
            {analysis.overallRedundancyScore >= 40 && analysis.overallRedundancyScore < 60 && 'Significant gaps in critical skills. Active mitigation required.'}
            {analysis.overallRedundancyScore < 40 && 'Critical business continuity risk. Immediate action essential.'}
          </p>
        </CardContent>
      </Card>

      {/* SPOF List */}
      <Card>
        <CardHeader>
          <CardTitle>Single Points of Failure ({analysis.spofs.length})</CardTitle>
          <CardDescription>
            Critical skills held by only one team member (sorted by criticality)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analysis.spofs.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-900 mb-2">Excellent Redundancy!</h3>
              <p className="text-gray-600">No single points of failure detected. All critical skills have backup coverage.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {analysis.spofs.map((spof) => (
                <div
                  key={spof.skillId}
                  className={`p-4 rounded-lg border-2 cursor-pointer hover:shadow-lg transition-shadow ${getRiskColor(spof.riskLevel)}`}
                  onClick={() => setSelectedSPOF(spof)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg">{spof.skillName}</h3>
                        <Badge className={getRiskBadgeColor(spof.riskLevel)}>
                          {spof.riskLevel}
                        </Badge>
                        <Badge variant="outline">
                          {spof.skillCategory}
                        </Badge>
                        {spof.wouldBlockDelivery && (
                          <Badge className="bg-red-600">
                            Blocks Delivery
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                        <div className="bg-white bg-opacity-60 p-2 rounded">
                          <p className="text-xs text-gray-600">Sole Expert</p>
                          <p className="font-semibold">{spof.soleExpertName}</p>
                          <p className="text-sm text-gray-600">Level {spof.soleExpertLevel}/5</p>
                        </div>

                        <div className="bg-white bg-opacity-60 p-2 rounded">
                          <p className="text-xs text-gray-600">Client Impact</p>
                          <p className="font-semibold">{spof.estimatedClientImpact}</p>
                          <p className="text-sm text-gray-600">
                            {spof.wouldBlockDelivery ? 'Would block work' : 'Could delay work'}
                          </p>
                        </div>

                        <div className="bg-white bg-opacity-60 p-2 rounded">
                          <p className="text-xs text-gray-600">Action Required</p>
                          <p className="font-semibold">{spof.urgency}</p>
                          <p className="text-sm text-gray-600">
                            {spof.crossTrainCandidates.length > 0
                              ? `${spof.crossTrainCandidates.length} training candidate${spof.crossTrainCandidates.length > 1 ? 's' : ''}`
                              : 'Consider hiring'}
                          </p>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        {spof.shouldDocument && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Document
                          </Badge>
                        )}
                        {spof.crossTrainCandidates.length > 0 && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <GraduationCap className="w-3 h-3" />
                            Cross-train
                          </Badge>
                        )}
                        {spof.shouldHire && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <UserPlus className="w-3 h-3" />
                            Hire
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Criticality Score */}
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
                            strokeDasharray={`${spof.criticalityScore * 2.51} ${251 - spof.criticalityScore * 2.51}`}
                            className={
                              spof.riskLevel === 'Critical' ? 'text-red-600' :
                              spof.riskLevel === 'High' ? 'text-orange-600' :
                              spof.riskLevel === 'Medium' ? 'text-yellow-600' :
                              'text-blue-600'
                            }
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold">{spof.criticalityScore}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Criticality</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Mitigation Plan Modal */}
      {selectedSPOF && (() => {
        const mitigationPlan = generateMitigationPlan(selectedSPOF);
        
        return (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedSPOF(null)}
          >
            <div
              className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedSPOF.skillName}</h2>
                    <p className="text-gray-600">Mitigation Plan</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getRiskBadgeColor(selectedSPOF.riskLevel)}>
                      {selectedSPOF.riskLevel}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedSPOF(null)}>
                      ✕
                    </Button>
                  </div>
                </div>

                {/* Current Situation */}
                <Alert className={
                  selectedSPOF.wouldBlockDelivery
                    ? 'border-red-300 bg-red-50'
                    : 'border-orange-300 bg-orange-50'
                }>
                  <AlertTriangle className="w-5 h-5" />
                  <AlertDescription>
                    <strong>Current Risk:</strong> Only {selectedSPOF.soleExpertName} has competent-level expertise in {selectedSPOF.skillName}. 
                    {selectedSPOF.wouldBlockDelivery && ' Loss would block client delivery.'}
                  </AlertDescription>
                </Alert>

                {/* Cross-Training Candidates */}
                {selectedSPOF.crossTrainCandidates.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                      Cross-Training Candidates
                    </h3>
                    <div className="space-y-3">
                      {selectedSPOF.crossTrainCandidates.map((candidate, idx) => (
                        <div key={idx} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-semibold">{candidate.memberName}</h4>
                              <p className="text-sm text-gray-600">
                                Current Level: {candidate.currentLevel}/5 • Gap to close: {candidate.gapToClose} levels
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-blue-600">{candidate.suitabilityScore}</div>
                              <p className="text-xs text-gray-600">Suitability</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Clock className="w-4 h-4" />
                            Estimated time: {candidate.estimatedTimeWeeks} weeks
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Actions */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Recommended Actions</h3>
                  <div className="space-y-3">
                    {mitigationPlan.recommendations.map((rec, idx) => (
                      <div key={idx} className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{rec.action}</h4>
                              <Badge className={
                                rec.priority === 'Critical' ? 'bg-red-600' :
                                rec.priority === 'High' ? 'bg-orange-600' :
                                'bg-yellow-600'
                              }>
                                {rec.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{rec.expectedOutcome}</p>
                            <div className="text-xs text-gray-600 space-y-1">
                              <p><strong>Timeframe:</strong> {rec.timeframe}</p>
                              <p><strong>Resources:</strong> {rec.resources}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cost & Time Estimate */}
                <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Estimated Cost</p>
                    <p className="text-2xl font-bold text-gray-900">{mitigationPlan.estimatedCost}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estimated Time</p>
                    <p className="text-2xl font-bold text-gray-900">{mitigationPlan.estimatedTime}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

