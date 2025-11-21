/**
 * Composition Tab - Team Assessment Charts & Analysis
 * Displays team composition data including communication styles, Belbin roles, EQ, conflict styles, VARK, and OCEAN
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Brain, Users, MessageSquare, Heart, Shield, 
  Lightbulb, Activity, Loader2, AlertCircle, Clock, Settings, Zap
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { ChartErrorBoundary } from '@/components/ErrorBoundary';
import type { TeamComposition, TeamDynamics, TeamMember } from '@/types/team-insights';
import { getFriendlyName, CHART_COLORS } from '@/utils/team-insights/helpers';

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

const COLORS = CHART_COLORS; // Use colors from helpers

export const CompositionTab: React.FC<CompositionTabProps> = ({
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
      {!teamComposition || (teamComposition.communicationStyles.length === 0 && teamComposition.belbinRoles.length === 0) ? (
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
          {(() => {
            try {
              return (
                <>
                  {/* Communication Styles */}
                  {teamComposition.communicationStyles && teamComposition.communicationStyles.length > 0 ? (() => {
                    try {
                      const validCommData = teamComposition.communicationStyles
                        .map(item => ({
                          style: String(getFriendlyName('communication', item?.style || 'unknown') || 'Unknown'),
                          count: Number.isFinite(item?.count) && item.count >= 0 ? Math.floor(item.count) : 0
                        }))
                        .filter(item => item.count > 0 && item.style && item.style !== 'Unknown');
                      
                      if (validCommData.length === 0) return null;
                      
                      if (validCommData.length === 1) {
                        return (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-blue-600" />
                                Communication Style Distribution
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-center py-8">
                                <div className="inline-block px-8 py-4 bg-blue-100 rounded-lg">
                                  <div className="text-3xl font-bold text-blue-600 mb-2">{validCommData[0].count}</div>
                                  <div className="text-lg font-medium text-gray-900">{validCommData[0].style}</div>
                                </div>
                                <p className="text-sm text-gray-600 mt-4">
                                  All team members share the same communication style
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      }
                      
                      if (validCommData.length <= 3) {
                        return (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-blue-600" />
                                Communication Style Distribution
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {validCommData.map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                                    <span className="font-medium text-gray-900">{item.style}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-2xl font-bold text-blue-600">{item.count}</span>
                                      <span className="text-sm text-gray-600">member{item.count > 1 ? 's' : ''}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      }
                      
                      return (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <MessageSquare className="w-5 h-5 text-blue-600" />
                              Communication Style Distribution
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                              <PieChart>
                                <Pie
                                  data={validCommData}
                                  dataKey="count"
                                  nameKey="style"
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={100}
                                  isAnimationActive={false}
                                  label={false}
                                >
                                  {validCommData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Legend />
                                <RechartsTooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      );
                    } catch (error) {
                      console.error('[CompositionTab] Error rendering communication chart:', error);
                      return (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <MessageSquare className="w-5 h-5 text-blue-600" />
                              Communication Style Distribution
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-center py-8 text-gray-600">
                              Unable to display chart. Data may be incomplete.
                            </div>
                          </CardContent>
                        </Card>
                      );
                    }
                  })() : null}

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
                  {teamComposition.eqDistribution && teamComposition.eqDistribution.length > 0 ? (() => {
                    try {
                      const validEqData = teamComposition.eqDistribution
                        .map(item => ({
                          level: String(getFriendlyName('eq', item?.level || 'unknown') || 'Unknown'),
                          count: Number.isFinite(item?.count) && item.count >= 0 ? Math.floor(item.count) : 0
                        }))
                        .filter(item => item.count > 0 && item.level && item.level !== 'Unknown');
                      
                      if (validEqData.length === 0) return null;
                      
                      if (validEqData.length === 1) {
                        return (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Heart className="w-5 h-5 text-red-600" />
                                Emotional Intelligence
                              </CardTitle>
                              <CardDescription>
                                Team Average EQ: <span className="font-bold text-lg">{Math.round(teamComposition.avgEQ || 0)}</span>
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="text-center py-8">
                                <div className="inline-block px-8 py-4 bg-red-100 rounded-lg">
                                  <div className="text-3xl font-bold text-red-600 mb-2">{validEqData[0].count}</div>
                                  <div className="text-lg font-medium text-gray-900">{validEqData[0].level}</div>
                                </div>
                                <p className="text-sm text-gray-600 mt-4">
                                  All team members have {validEqData[0].level.toLowerCase()} emotional intelligence
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      }
                      
                      return (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Heart className="w-5 h-5 text-red-600" />
                              Emotional Intelligence
                            </CardTitle>
                            <CardDescription>
                              Team Average EQ: <span className="font-bold text-lg">{Math.round(teamComposition.avgEQ || 0)}</span>
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                              <BarChart data={validEqData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="level" />
                                <YAxis allowDecimals={false} />
                                <RechartsTooltip />
                                <Bar dataKey="count" fill="#ef4444" isAnimationActive={false} />
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      );
                    } catch (error) {
                      console.error('[CompositionTab] Error rendering EQ chart:', error);
                      return null;
                    }
                  })() : null}

                  {/* Work Styles Distribution */}
                  {teamComposition.workStyles && teamComposition.workStyles.length > 0 ? (() => {
                    try {
                      const validWorkData = teamComposition.workStyles
                        .map(item => ({
                          style: String(getFriendlyName('workStyle', item?.style || 'unknown') || 'Unknown'),
                          count: Number.isFinite(item?.count) && item.count >= 0 ? Math.floor(item.count) : 0
                        }))
                        .filter(item => item.count > 0 && item.style && item.style !== 'Unknown');
                      
                      if (validWorkData.length === 0) return null;
                    
                      if (validWorkData.length === 1) {
                        return (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-green-600" />
                                Work Style Distribution
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-center py-8">
                                <div className="inline-block px-8 py-4 bg-green-100 rounded-lg">
                                  <div className="text-3xl font-bold text-green-600 mb-2">{validWorkData[0].count}</div>
                                  <div className="text-lg font-medium text-gray-900">{validWorkData[0].style}</div>
                                </div>
                                <p className="text-sm text-gray-600 mt-4">
                                  All team members prefer the same work style
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      }
                      
                      if (validWorkData.length <= 3) {
                        return (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-green-600" />
                                Work Style Distribution
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {validWorkData.map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                                    <span className="font-medium text-gray-900">{item.style}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-2xl font-bold text-green-600">{item.count}</span>
                                      <span className="text-sm text-gray-600">member{item.count > 1 ? 's' : ''}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      }
                      
                      return (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Clock className="w-5 h-5 text-green-600" />
                              Work Style Distribution
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                              <PieChart>
                                <Pie
                                  data={validWorkData}
                                  dataKey="count"
                                  nameKey="style"
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={100}
                                  isAnimationActive={false}
                                  label={false}
                                >
                                  {validWorkData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Legend />
                                <RechartsTooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      );
                    } catch (error) {
                      console.error('[CompositionTab] Error rendering work styles chart:', error);
                      return null;
                    }
                  })() : null}

                  {/* Work Environment Preferences */}
                  {teamComposition.environments && teamComposition.environments.length > 0 ? (() => {
                    try {
                      const validEnvData = teamComposition.environments
                        .map(item => ({
                          env: String(getFriendlyName('environment', item?.env || 'unknown') || 'Unknown'),
                          count: Number.isFinite(item?.count) && item.count >= 0 ? Math.floor(item.count) : 0
                        }))
                        .filter(item => item.count > 0 && item.env && item.env !== 'Unknown');
                      
                      if (validEnvData.length === 0) return null;
                    
                      return (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Settings className="w-5 h-5 text-orange-600" />
                              Work Environment Preferences
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {validEnvData.map((env, index) => (
                                <div key={index} className="flex items-center gap-4">
                                  <div className="w-48 font-medium text-gray-900">{env.env}</div>
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
                      );
                    } catch (error) {
                      console.error('[CompositionTab] Error rendering environment chart:', error);
                      return null;
                    }
                  })() : null}

                  {/* Motivational Drivers */}
                  {teamComposition.motivationalDrivers && teamComposition.motivationalDrivers.length > 0 ? (() => {
                    try {
                      const validMotivData = teamComposition.motivationalDrivers
                        .map(item => ({
                          driver: String(getFriendlyName('motivation', item?.driver || 'unknown') || 'Unknown'),
                          count: Number.isFinite(item?.count) && item.count >= 0 ? Math.floor(item.count) : 0
                        }))
                        .filter(item => item.count > 0 && item.driver && item.driver !== 'Unknown');
                      
                      if (validMotivData.length === 0) return null;
                    
                      if (validMotivData.length === 1) {
                        return (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Zap className="w-5 h-5 text-yellow-600" />
                                Motivational Drivers
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-center py-8">
                                <div className="inline-block px-8 py-4 bg-yellow-100 rounded-lg">
                                  <div className="text-3xl font-bold text-yellow-600 mb-2">{validMotivData[0].count}</div>
                                  <div className="text-lg font-medium text-gray-900">{validMotivData[0].driver}</div>
                                </div>
                                <p className="text-sm text-gray-600 mt-4">
                                  All team members share the same primary motivational driver
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      }
                      
                      return (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Zap className="w-5 h-5 text-yellow-600" />
                              Motivational Drivers
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart data={validMotivData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="driver" />
                                <YAxis allowDecimals={false} />
                                <RechartsTooltip />
                                <Bar dataKey="count" fill="#f59e0b" isAnimationActive={false} />
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      );
                    } catch (error) {
                      console.error('[CompositionTab] Error rendering motivational chart:', error);
                      return null;
                    }
                  })() : null}

                  {/* Conflict Styles */}
                  {teamComposition.conflictStyles && teamComposition.conflictStyles.length > 0 ? (() => {
                    try {
                      const validConflictData = teamComposition.conflictStyles
                        .map(item => ({
                          style: String(getFriendlyName('conflict', item?.style || 'unknown') || 'Unknown'),
                          count: Number.isFinite(item?.count) && item.count >= 0 ? Math.floor(item.count) : 0
                        }))
                        .filter(item => item.count > 0 && item.style && item.style !== 'Unknown');
                      
                      if (validConflictData.length === 0) return null;
                    
                      if (validConflictData.length === 1) {
                        return (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-purple-600" />
                                Conflict Resolution Styles
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-center py-8">
                                <div className="inline-block px-8 py-4 bg-purple-100 rounded-lg">
                                  <div className="text-3xl font-bold text-purple-600 mb-2">{validConflictData[0].count}</div>
                                  <div className="text-lg font-medium text-gray-900">{validConflictData[0].style}</div>
                                </div>
                                <p className="text-sm text-gray-600 mt-4">
                                  All team members use the same conflict resolution approach
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      }
                      
                      return (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Shield className="w-5 h-5 text-purple-600" />
                              Conflict Resolution Styles
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart data={validConflictData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="style" />
                                <YAxis allowDecimals={false} />
                                <RechartsTooltip />
                                <Bar dataKey="count" fill="#a855f7" isAnimationActive={false} />
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      );
                    } catch (error) {
                      console.error('[CompositionTab] Error rendering conflict chart:', error);
                      return null;
                    }
                  })() : null}

                  {/* VARK Learning Styles */}
                  {teamComposition.varkStyles && teamComposition.varkStyles.length > 0 ? (() => {
                    try {
                      const validVarkData = teamComposition.varkStyles
                        .map(item => ({
                          style: String(getFriendlyName('vark', item?.style || 'unknown') || 'Unknown'),
                          count: Number.isFinite(item?.count) && item.count >= 0 ? Math.floor(item.count) : 0
                        }))
                        .filter(item => item.count > 0 && item.style && item.style !== 'Unknown');
                      
                      if (validVarkData.length === 0) return null;
                    
                      if (validVarkData.length === 1) {
                        return (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Brain className="w-5 h-5 text-indigo-600" />
                                VARK Learning Styles
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-center py-8">
                                <div className="inline-block px-8 py-4 bg-indigo-100 rounded-lg">
                                  <div className="text-3xl font-bold text-indigo-600 mb-2">{validVarkData[0].count}</div>
                                  <div className="text-lg font-medium text-gray-900">{validVarkData[0].style}</div>
                                </div>
                                <p className="text-sm text-gray-600 mt-4">
                                  All team members share the same learning preference
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      }
                      
                      if (validVarkData.length <= 3) {
                        return (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Brain className="w-5 h-5 text-indigo-600" />
                                VARK Learning Styles
                              </CardTitle>
                              <CardDescription>
                                Distribution of Visual, Auditory, Reading/Writing, and Kinesthetic learners
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {validVarkData.map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg">
                                    <span className="font-medium text-gray-900">{item.style}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-2xl font-bold text-indigo-600">{item.count}</span>
                                      <span className="text-sm text-gray-600">member{item.count > 1 ? 's' : ''}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      }
                      
                      return (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Brain className="w-5 h-5 text-indigo-600" />
                              VARK Learning Styles
                            </CardTitle>
                            <CardDescription>
                              Distribution of Visual, Auditory, Reading/Writing, and Kinesthetic learners
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                              <PieChart>
                                <Pie
                                  data={validVarkData}
                                  dataKey="count"
                                  nameKey="style"
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={100}
                                  isAnimationActive={false}
                                  label={false}
                                >
                                  {validVarkData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Legend />
                                <RechartsTooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      );
                    } catch (error) {
                      console.error('[CompositionTab] Error rendering VARK chart:', error);
                      return null;
                    }
                  })() : null}

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
                            <p className="text-xs text-gray-500 mt-1">Calmness, resilience, and emotional regulation (inverse of neuroticism)</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              );
            } catch (error) {
              console.error('[CompositionTab] Error rendering Team Composition tab:', error);
              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      Unable to Display Team Composition
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 space-y-4">
                      <p className="text-gray-700">
                        There was an error displaying the team composition data.
                      </p>
                      <p className="text-sm text-gray-600">
                        This may be due to incomplete assessment data. Please ensure team members have completed their assessments.
                      </p>
                      <Button onClick={() => window.location.reload()} variant="outline">
                        Refresh Page
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            }
          })()}
        </ChartErrorBoundary>
      )}
    </div>
  );
};

