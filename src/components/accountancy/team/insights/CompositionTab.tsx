/**
 * Composition Tab - Team Assessment Charts & Analysis (Refactored)
 * Now uses reusable chart components for cleaner code
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Brain, Users, MessageSquare, Heart, Shield, 
  Lightbulb, Clock, Settings, Zap, Loader2
} from 'lucide-react';
import { ChartErrorBoundary } from '@/components/ErrorBoundary';
import { PieChartCard, BarChartCard } from '@/components/charts';
import type { TeamComposition, TeamDynamics, TeamMember } from '@/types/team-insights';
import { getFriendlyName } from '@/utils/team-insights/helpers';

interface CompositionTabProps {
  loading: boolean;
  teamComposition: TeamComposition | null;
  teamDynamics: TeamDynamics | null;
  teamMembers: TeamMember[];
  compositionAnalysis: string | null;
  gapAnalysis: string | null;
  generatingComposition: boolean;
  generatingGap: boolean;
  onGenerateComposition: () => Promise<void>;
  onGenerateGapAnalysis: () => Promise<void>;
}

export const CompositionTab: React.FC<CompositionTabProps> = React.memo(({
  loading,
  teamComposition,
  teamDynamics,
  teamMembers,
  compositionAnalysis,
  gapAnalysis,
  generatingComposition,
  generatingGap,
  onGenerateComposition,
  onGenerateGapAnalysis,
}) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading team composition data...</p>
        </CardContent>
      </Card>
    );
  }

  // Transform data for charts
  const communicationData = teamComposition?.communicationStyles?.map(item => ({
    style: String(getFriendlyName('communication', item?.style || '') || item?.style || 'Unknown'),
    count: Number(item?.count) || 0
  })).filter(item => item.count > 0 && item.style !== 'Unknown') || [];

  const eqData = teamComposition?.eqDistribution?.map(item => ({
    level: String(getFriendlyName('eq', item?.level || '') || item?.level || 'Unknown'),
    count: Number(item?.count) || 0
  })).filter(item => item.count > 0 && item.level !== 'Unknown') || [];

  const workStyleData = teamComposition?.workStyles?.map(item => ({
    style: String(getFriendlyName('workStyle', item?.style || '') || item?.style || 'Unknown'),
    count: Number(item?.count) || 0
  })).filter(item => item.count > 0 && item.style !== 'Unknown') || [];

  const motivationalData = teamComposition?.motivationalDrivers?.map(item => ({
    driver: String(getFriendlyName('motivation', item?.driver || '') || item?.driver || 'Unknown'),
    count: Number(item?.count) || 0
  })).filter(item => item.count > 0 && item.driver !== 'Unknown') || [];

  const conflictData = teamComposition?.conflictStyles?.map(item => ({
    style: String(getFriendlyName('conflict', item?.style || '') || item?.style || 'Unknown'),
    count: Number(item?.count) || 0
  })).filter(item => item.count > 0 && item.style !== 'Unknown') || [];

  const varkData = teamComposition?.varkStyles?.map(item => ({
    style: String(getFriendlyName('vark', item?.style || '') || item?.style || 'Unknown'),
    count: Number(item?.count) || 0
  })).filter(item => item.count > 0 && item.style !== 'Unknown') || [];

  return (
    <div className="space-y-6">
      {/* AI-Powered Team Composition Analysis */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-600" />
                AI-Powered Team Dynamics Analysis
              </CardTitle>
              <CardDescription>
                Insights on team compatibility, collaboration patterns, and optimal configurations
              </CardDescription>
            </div>
            <Button
              onClick={onGenerateComposition}
              disabled={generatingComposition}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              {generatingComposition ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 mr-2" />
                  {compositionAnalysis ? 'Regenerate Analysis' : 'Generate Analysis'}
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        {generatingComposition ? (
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-16 h-16 text-purple-600 animate-spin" />
            <div className="text-center space-y-2">
              <p className="text-lg font-medium text-purple-900">Analyzing Team Composition</p>
              <p className="text-sm text-gray-600">Identifying dynamics, synergies, and friction points...</p>
              <p className="text-xs text-gray-500">This may take 20-40 seconds</p>
            </div>
          </CardContent>
        ) : compositionAnalysis ? (
          <CardContent className="space-y-6">
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">{compositionAnalysis}</div>
            </div>
          </CardContent>
        ) : (
          <CardContent className="flex flex-col items-center justify-center py-8 space-y-2">
            <p className="text-sm text-gray-600">Click "Generate Analysis" to create AI-powered team dynamics insights</p>
          </CardContent>
        )}
      </Card>

      {/* Team Composition Charts */}
      {!teamComposition || (communicationData.length === 0 && teamComposition.belbinRoles.length === 0) ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assessment Data</h3>
            <p className="text-gray-600">
              Team members need to complete their assessments before composition data can be displayed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ChartErrorBoundary 
          onError={(error) => console.error('[CompositionTab] Chart rendering error:', error)}
        >
          <div className="grid gap-6">
            {/* Communication Styles */}
            {communicationData.length > 0 && (
              <PieChartCard
                title="Communication Style Distribution"
                icon={MessageSquare}
                iconColor="text-blue-600"
                data={communicationData}
                dataKey="count"
                nameKey="style"
                singleItemColor="bg-blue-100 text-blue-600"
                fallbackMessage="All team members share the same communication style"
              />
            )}

            {/* Belbin Roles */}
            {teamComposition.belbinRoles && teamComposition.belbinRoles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    Belbin Team Roles
                  </CardTitle>
                  <CardDescription>
                    Role Balance: <Badge variant={teamComposition.roleBalance === 'Excellent' ? 'default' : 'secondary'}>
                      {teamComposition.roleBalance}
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {teamComposition.belbinRoles.map((role) => (
                      <div key={role.role}>
                        <div className="flex justify-between mb-1">
                          <span className="font-medium text-gray-900 capitalize">{String(role.role || '')}</span>
                          <span className="text-gray-600">{Number(role.count) || 0} members</span>
                        </div>
                        <Progress 
                          value={teamMembers.length > 0 ? Math.min(100, (Number(role.count) / teamMembers.length) * 100) : 0} 
                          className="h-2" 
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {Array.isArray(role.members) ? role.members.filter(m => m).join(', ') : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* EQ Distribution */}
            {eqData.length > 0 && (
              <BarChartCard
                title="Emotional Intelligence"
                description={
                  <>
                    Team Average EQ: <span className="font-bold text-lg">{Math.round(teamComposition?.avgEQ || 0)}</span>
                  </>
                }
                icon={Heart}
                iconColor="text-red-600"
                data={eqData}
                dataKey="count"
                xAxisKey="level"
                barColor="#ef4444"
                singleItemColor="bg-red-100 text-red-600"
                fallbackMessage={`All team members have ${eqData[0]?.level.toLowerCase()} emotional intelligence`}
              />
            )}

            {/* Work Styles */}
            {workStyleData.length > 0 && (
              <PieChartCard
                title="Work Style Distribution"
                icon={Clock}
                iconColor="text-green-600"
                data={workStyleData}
                dataKey="count"
                nameKey="style"
                singleItemColor="bg-green-100 text-green-600"
                fallbackMessage="All team members prefer the same work style"
              />
            )}

            {/* Work Environment Preferences */}
            {teamComposition.environments && teamComposition.environments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-orange-600" />
                    Work Environment Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {teamComposition.environments.map((env, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="w-48 font-medium text-gray-900">
                          {getFriendlyName('environment', env.env) || env.env}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={teamMembers.length > 0 ? (env.count / teamMembers.length) * 100 : 0} 
                              className="h-2 flex-1" 
                            />
                            <span className="text-sm text-gray-600 w-12 text-right">{env.count}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Motivational Drivers */}
            {motivationalData.length > 0 && (
              <BarChartCard
                title="Motivational Drivers"
                icon={Zap}
                iconColor="text-yellow-600"
                data={motivationalData}
                dataKey="count"
                xAxisKey="driver"
                barColor="#f59e0b"
                singleItemColor="bg-yellow-100 text-yellow-600"
                fallbackMessage="All team members share the same primary motivational driver"
              />
            )}

            {/* Conflict Styles */}
            {conflictData.length > 0 && (
              <BarChartCard
                title="Conflict Resolution Styles"
                icon={Shield}
                iconColor="text-purple-600"
                data={conflictData}
                dataKey="count"
                xAxisKey="style"
                barColor="#a855f7"
                singleItemColor="bg-purple-100 text-purple-600"
                fallbackMessage="All team members use the same conflict resolution approach"
              />
            )}

            {/* VARK Learning Styles */}
            {varkData.length > 0 && (
              <PieChartCard
                title="VARK Learning Styles"
                description="Distribution of Visual, Auditory, Reading/Writing, and Kinesthetic learners"
                icon={Brain}
                iconColor="text-indigo-600"
                data={varkData}
                dataKey="count"
                nameKey="style"
                singleItemColor="bg-indigo-100 text-indigo-600"
                fallbackMessage="All team members share the same learning preference"
              />
            )}

            {/* OCEAN Personality Profile */}
            {teamComposition.avgPersonality && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-teal-600" />
                    Team Personality Profile (OCEAN)
                  </CardTitle>
                  <CardDescription>
                    Average Big Five personality trait scores across the team
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-gray-900">Openness to Experience</span>
                        <span className="text-gray-600">{teamComposition.avgPersonality.openness}%</span>
                      </div>
                      <Progress value={teamComposition.avgPersonality.openness} className="h-3" />
                      <p className="text-xs text-gray-500 mt-1">Creativity, curiosity, and willingness to try new things</p>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-gray-900">Conscientiousness</span>
                        <span className="text-gray-600">{teamComposition.avgPersonality.conscientiousness}%</span>
                      </div>
                      <Progress value={teamComposition.avgPersonality.conscientiousness} className="h-3" />
                      <p className="text-xs text-gray-500 mt-1">Organization, dependability, and self-discipline</p>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-gray-900">Extraversion</span>
                        <span className="text-gray-600">{teamComposition.avgPersonality.extraversion}%</span>
                      </div>
                      <Progress value={teamComposition.avgPersonality.extraversion} className="h-3" />
                      <p className="text-xs text-gray-500 mt-1">Sociability, assertiveness, and enthusiasm</p>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-gray-900">Agreeableness</span>
                        <span className="text-gray-600">{teamComposition.avgPersonality.agreeableness}%</span>
                      </div>
                      <Progress value={teamComposition.avgPersonality.agreeableness} className="h-3" />
                      <p className="text-xs text-gray-500 mt-1">Compassion, cooperation, and trust</p>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-gray-900">Emotional Stability</span>
                        <span className="text-gray-600">{100 - teamComposition.avgPersonality.neuroticism}%</span>
                      </div>
                      <Progress value={100 - teamComposition.avgPersonality.neuroticism} className="h-3" />
                      <p className="text-xs text-gray-500 mt-1">Calmness, resilience, and emotional regulation</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ChartErrorBoundary>
      )}
    </div>
  );
});

CompositionTab.displayName = 'CompositionTab';
