/**
 * Strategic Insights Tab - Role-Fit Analysis & Team Composition
 * Displays strategic assessment framework with role suitability scores
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, Loader2, AlertCircle, CheckCircle2, Lightbulb } from 'lucide-react';
import type { AssessmentInsight } from '@/lib/api/assessment-insights/role-fit-analyzer';
import type { TeamCompositionInsight } from '@/lib/api/assessment-insights/team-composition-analyzer';

interface StrategicTabProps {
  loading: boolean;
  individualInsights: AssessmentInsight[];
  strategicTeamInsight: TeamCompositionInsight | null;
  calculatingStrategic: boolean;
  onCalculateStrategic: (force: boolean) => Promise<void>;
}

export const StrategicTab: React.FC<StrategicTabProps> = React.memo(({
  loading,
  individualInsights,
  strategicTeamInsight,
  calculatingStrategic,
  onCalculateStrategic,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Target className="w-6 h-6 text-blue-600" />
                Strategic Assessment Framework
              </CardTitle>
              <CardDescription>
                Role-fit analysis, team composition scoring, and succession planning based on comprehensive assessment data
              </CardDescription>
            </div>
            <Button
              onClick={() => onCalculateStrategic(true)}
              disabled={calculatingStrategic}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              {calculatingStrategic ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  {individualInsights.length > 0 ? 'Force Refresh' : 'Calculate Strategic Insights'}
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        
        {calculatingStrategic ? (
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
            <div className="text-center space-y-2">
              <p className="text-lg font-medium text-blue-900">Analyzing Team Performance</p>
              <p className="text-sm text-gray-600">Calculating role-fit scores, red flags, and development priorities...</p>
              <p className="text-xs text-gray-500">This may take 30-60 seconds</p>
            </div>
          </CardContent>
        ) : individualInsights.length > 0 && strategicTeamInsight ? (
          <CardContent className="space-y-6">
            {/* Team Health Overview */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm border">
                <div className="text-3xl font-bold text-blue-600">{strategicTeamInsight.teamHealthScore}</div>
                <div className="text-sm text-gray-600 mt-1">Team Health Score</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm border">
                <div className="text-3xl font-bold text-green-600">
                  {individualInsights.filter(i => i.currentRoleMatch >= 80).length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Optimal Role Fit</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm border">
                <div className="text-3xl font-bold text-red-600">
                  {individualInsights.reduce((sum, i) => sum + i.redFlags.length, 0)}
                </div>
                <div className="text-sm text-gray-600 mt-1">Critical Issues</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm border">
                <div className="text-3xl font-bold text-purple-600">
                  {individualInsights.filter(i => i.successionReadiness >= 70).length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Leadership Ready</div>
              </div>
            </div>

            {/* Individual Role-Fit Scores */}
            <Card>
              <CardHeader>
                <CardTitle>Individual Role-Fit Analysis</CardTitle>
                <CardDescription>Advisory, technical, hybrid, and leadership suitability scores for each team member</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {individualInsights.map(insight => (
                    <div key={insight.memberId} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">{insight.memberName}</h4>
                          <p className="text-sm text-gray-600">
                            Recommended: <span className="font-medium capitalize">{insight.recommendedRoleType}</span>
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {insight.redFlags.length > 0 && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {insight.redFlags.length} Critical
                            </Badge>
                          )}
                          {insight.currentRoleMatch >= 80 && (
                            <Badge className="bg-green-600">Excellent Fit</Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-3 mb-3">
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Advisory</div>
                          <div className="flex items-center gap-2">
                            <Progress value={insight.roleFitScores.advisorySuitability} className="h-2 flex-1" />
                            <span className="text-sm font-medium w-8 text-right">
                              {insight.roleFitScores.advisorySuitability}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Technical</div>
                          <div className="flex items-center gap-2">
                            <Progress value={insight.roleFitScores.technicalSuitability} className="h-2 flex-1" />
                            <span className="text-sm font-medium w-8 text-right">
                              {insight.roleFitScores.technicalSuitability}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Hybrid</div>
                          <div className="flex items-center gap-2">
                            <Progress value={insight.roleFitScores.hybridSuitability} className="h-2 flex-1" />
                            <span className="text-sm font-medium w-8 text-right">
                              {insight.roleFitScores.hybridSuitability}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Leadership</div>
                          <div className="flex items-center gap-2">
                            <Progress value={insight.roleFitScores.leadershipReadiness} className="h-2 flex-1" />
                            <span className="text-sm font-medium w-8 text-right">
                              {insight.roleFitScores.leadershipReadiness}
                            </span>
                          </div>
                        </div>
                      </div>

                      {insight.redFlags.length > 0 && (
                        <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
                          <div className="text-sm font-medium text-red-900 mb-2">⚠️ Critical Issues:</div>
                          <ul className="text-sm text-red-800 space-y-1">
                            {insight.redFlags.map((flag, idx) => (
                              <li key={idx}>• {flag.message}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {insight.developmentPriorities.length > 0 && (
                        <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                          <div className="text-sm font-medium text-blue-900 mb-2">📈 Development Priorities:</div>
                          <ul className="text-sm text-blue-800 space-y-1">
                            {insight.developmentPriorities.slice(0, 2).map((priority, idx) => (
                              <li key={idx}>
                                {idx + 1}. {priority.area} - {priority.description}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Team Composition Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Team Composition Analysis</CardTitle>
                <CardDescription>Belbin balance, EQ mapping, and motivational alignment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Belbin Balance */}
                <div>
                  <h4 className="font-semibold mb-2">Belbin Role Balance</h4>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="text-2xl font-bold text-blue-600">
                      {strategicTeamInsight.belbinBalance.balanceScore}
                    </div>
                    <div className="flex-1">
                      <Progress value={strategicTeamInsight.belbinBalance.balanceScore} className="h-3" />
                    </div>
                  </div>
                  {strategicTeamInsight.belbinBalance.gaps.length > 0 && (
                    <div className="text-sm text-orange-700 bg-orange-50 p-2 rounded mt-2">
                      <span className="font-medium">Gaps:</span> {strategicTeamInsight.belbinBalance.gaps.join(', ')}
                    </div>
                  )}
                  {strategicTeamInsight.belbinBalance.overlaps.length > 0 && (
                    <div className="text-sm text-blue-700 bg-blue-50 p-2 rounded mt-2">
                      <span className="font-medium">Overlaps:</span> {strategicTeamInsight.belbinBalance.overlaps.join(', ')}
                    </div>
                  )}
                </div>

                {/* EQ Collective Capability */}
                <div>
                  <h4 className="font-semibold mb-2">EQ Collective Capability</h4>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="text-2xl font-bold text-purple-600">
                      {strategicTeamInsight.eqMapping.eqCollectiveCapability}
                    </div>
                    <div className="flex-1">
                      <Progress value={strategicTeamInsight.eqMapping.eqCollectiveCapability} className="h-3" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                    <div className="p-2 bg-gray-50 rounded">
                      <span className="text-gray-600">Avg Self-Awareness:</span>
                      <span className="font-medium ml-2">{strategicTeamInsight.eqMapping.avgSelfAwareness}</span>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <span className="text-gray-600">Avg Social Awareness:</span>
                      <span className="font-medium ml-2">{strategicTeamInsight.eqMapping.avgSocialAwareness}</span>
                    </div>
                  </div>
                </div>

                {/* Motivational Alignment */}
                <div>
                  <h4 className="font-semibold mb-2">Motivational Alignment</h4>
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-green-600">
                      {strategicTeamInsight.motivationalDistribution.alignmentScore}
                    </div>
                    <div className="flex-1">
                      <Progress value={strategicTeamInsight.motivationalDistribution.alignmentScore} className="h-3" />
                    </div>
                  </div>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Team Strengths
                    </h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      {strategicTeamInsight.strengths.map((strength, idx) => (
                        <li key={idx}>✓ {strength}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Areas for Improvement
                    </h4>
                    <ul className="text-sm text-orange-800 space-y-1">
                      {strategicTeamInsight.weaknesses.map((weakness, idx) => (
                        <li key={idx}>→ {weakness}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Strategic Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {strategicTeamInsight.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                        <span className="font-bold text-blue-600">{idx + 1}.</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        ) : (
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <Target className="w-16 h-16 text-gray-400" />
            <div className="text-center space-y-2">
              <p className="text-lg font-medium text-gray-900">Ready to Calculate Strategic Insights</p>
              <p className="text-sm text-gray-600">
                Click "Calculate Strategic Insights" to analyze role-fit scores, team composition, and succession planning.
              </p>
              <p className="text-xs text-gray-500">
                This comprehensive analysis uses weighted algorithms across all assessment dimensions.
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
});

StrategicTab.displayName = 'StrategicTab';

