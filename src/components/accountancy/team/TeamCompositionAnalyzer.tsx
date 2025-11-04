/**
 * Team Composition Analyzer
 * Advanced analytics and visualizations for team personality composition
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Users, TrendingUp, AlertCircle, CheckCircle, Brain, 
  Target, Zap, Shield, Lightbulb, MessageSquare, Download
} from 'lucide-react';
import { getPracticeTeamProfiles } from '@/lib/api/personality-assessment';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ScatterChart, Scatter, ZAxis, Cell
} from 'recharts';

interface TeamCompositionAnalyzerProps {
  practiceId: string;
}

export const TeamCompositionAnalyzer: React.FC<TeamCompositionAnalyzerProps> = ({ practiceId }) => {
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    loadAndAnalyzeTeam();
  }, [practiceId]);

  const loadAndAnalyzeTeam = async () => {
    setLoading(true);
    try {
      const data = await getPracticeTeamProfiles(practiceId);
      setTeamData(data);
      
      // Perform analysis
      const analyzed = analyzeTeamComposition(data);
      setAnalysis(analyzed);
    } catch (error) {
      console.error('[Team Composition Analyzer] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeTeamComposition = (team: any[]) => {
    const completed = team.filter(m => m.ocean_completed);
    
    if (completed.length === 0) {
      return null;
    }

    // Calculate averages
    const averages = {
      openness: Math.round(completed.reduce((sum, m) => sum + (m.openness_score || 0), 0) / completed.length),
      conscientiousness: Math.round(completed.reduce((sum, m) => sum + (m.conscientiousness_score || 0), 0) / completed.length),
      extraversion: Math.round(completed.reduce((sum, m) => sum + (m.extraversion_score || 0), 0) / completed.length),
      agreeableness: Math.round(completed.reduce((sum, m) => sum + (m.agreeableness_score || 0), 0) / completed.length),
      emotionalStability: Math.round(completed.reduce((sum, m) => sum + (m.emotional_stability_score || 0), 0) / completed.length)
    };

    // Calculate variance (diversity)
    const variance = {
      openness: calculateVariance(completed.map(m => m.openness_score || 0)),
      conscientiousness: calculateVariance(completed.map(m => m.conscientiousness_score || 0)),
      extraversion: calculateVariance(completed.map(m => m.extraversion_score || 0)),
      agreeableness: calculateVariance(completed.map(m => m.agreeableness_score || 0)),
      emotionalStability: calculateVariance(completed.map(m => m.emotional_stability_score || 0))
    };

    // Diversity score (0-1, higher is more diverse)
    const diversityScore = Math.min(1, (
      variance.openness + 
      variance.conscientiousness + 
      variance.extraversion + 
      variance.agreeableness + 
      variance.emotionalStability
    ) / 500);

    // Predicted dynamics
    const dynamics = {
      innovationPotential: calculateInnovationPotential(averages, variance),
      executionCapability: calculateExecutionCapability(averages, variance),
      conflictRisk: calculateConflictRisk(averages, variance),
      communicationEfficiency: calculateCommunicationEfficiency(averages, variance),
      adaptabilityScore: averages.openness / 100,
      reliabilityScore: averages.conscientiousness / 100
    };

    // Identify strengths and gaps
    const strengths = identifyStrengths(averages);
    const gaps = identifyGaps(averages);
    const recommendations = generateRecommendations(averages, variance, dynamics);

    return {
      teamSize: team.length,
      completedCount: completed.length,
      averages,
      variance,
      diversityScore,
      dynamics,
      strengths,
      gaps,
      recommendations
    };
  };

  const calculateVariance = (values: number[]): number => {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
  };

  const calculateInnovationPotential = (avg: any, variance: any): number => {
    // High openness + diverse perspectives
    return Math.min(1, (avg.openness / 100 + variance.openness / 100) / 2);
  };

  const calculateExecutionCapability = (avg: any, variance: any): number => {
    // High conscientiousness + low variance (aligned)
    return Math.min(1, avg.conscientiousness / 100 * (1 - variance.conscientiousness / 100));
  };

  const calculateConflictRisk = (avg: any, variance: any): number => {
    // High agreeableness variance + high neuroticism
    return Math.min(1, (variance.agreeableness + (100 - avg.emotionalStability)) / 200);
  };

  const calculateCommunicationEfficiency = (avg: any, variance: any): number => {
    // Low extraversion variance = similar communication styles
    return Math.min(1, 1 - (variance.extraversion / 100));
  };

  const identifyStrengths = (avg: any): string[] => {
    const strengths = [];
    if (avg.openness > 70) strengths.push('High Innovation Potential');
    if (avg.conscientiousness > 70) strengths.push('Strong Execution & Reliability');
    if (avg.extraversion > 60) strengths.push('Collaborative & Energetic');
    if (avg.agreeableness > 70) strengths.push('Harmonious Team Dynamics');
    if (avg.emotionalStability > 70) strengths.push('Resilient Under Pressure');
    return strengths;
  };

  const identifyGaps = (avg: any): string[] => {
    const gaps = [];
    if (avg.openness < 40) gaps.push('Limited Innovation Capacity');
    if (avg.conscientiousness < 40) gaps.push('Execution & Detail Challenges');
    if (avg.extraversion < 30) gaps.push('Needs External Engagement Support');
    if (avg.agreeableness < 40) gaps.push('Potential for Conflict');
    if (avg.emotionalStability < 40) gaps.push('Stress Management Concerns');
    return gaps;
  };

  const generateRecommendations = (avg: any, variance: any, dynamics: any): any[] => {
    const recs = [];

    if (dynamics.innovationPotential < 0.5) {
      recs.push({
        type: 'hiring',
        priority: 'high',
        title: 'Boost Innovation Capacity',
        description: 'Team scores low on Openness. Consider hiring for creative problem-solving skills.',
        action: 'Recruit team members with high openness to experience'
      });
    }

    if (dynamics.executionCapability < 0.5) {
      recs.push({
        type: 'development',
        priority: 'high',
        title: 'Improve Execution Discipline',
        description: 'Team needs stronger project management and organization.',
        action: 'Provide training on project management and quality processes'
      });
    }

    if (dynamics.conflictRisk > 0.6) {
      recs.push({
        type: 'intervention',
        priority: 'high',
        title: 'Conflict Prevention Required',
        description: 'High risk of team conflicts due to personality variance.',
        action: 'Implement communication protocols and team alignment sessions'
      });
    }

    if (variance.extraversion > 30) {
      recs.push({
        type: 'process',
        priority: 'medium',
        title: 'Diverse Communication Needs',
        description: 'Team has varied communication preferences.',
        action: 'Offer both synchronous (meetings) and asynchronous (email/docs) options'
      });
    }

    if (analysis?.diversityScore < 0.3) {
      recs.push({
        type: 'hiring',
        priority: 'low',
        title: 'Increase Personality Diversity',
        description: 'Team is homogeneous which may limit perspective variety.',
        action: 'Consider diverse personality profiles in future hiring'
      });
    }

    return recs;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing team composition...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Not Enough Data</h3>
          <p className="text-gray-600 mb-4">
            Need at least one team member to complete the personality assessment for analysis.
          </p>
          <p className="text-sm text-gray-500">
            {analysis?.completedCount || 0} of {analysis?.teamSize || 0} team members have completed assessments
          </p>
        </CardContent>
      </Card>
    );
  }

  const radarData = [
    { trait: 'Openness', score: Number(analysis.averages?.openness) || 0, optimal: 65, fullMark: 100 },
    { trait: 'Conscientiousness', score: Number(analysis.averages?.conscientiousness) || 0, optimal: 70, fullMark: 100 },
    { trait: 'Extraversion', score: Number(analysis.averages?.extraversion) || 0, optimal: 55, fullMark: 100 },
    { trait: 'Agreeableness', score: Number(analysis.averages?.agreeableness) || 0, optimal: 65, fullMark: 100 },
    { trait: 'Emotional Stability', score: Number(analysis.averages?.emotionalStability) || 0, optimal: 70, fullMark: 100 }
  ];

  // Validate radarData to ensure no NaN, undefined, or invalid values
  console.log('[TeamComposition] radarData before validation:', radarData);
  const validRadarData = radarData.map(item => ({
    ...item,
    trait: String(item.trait || ''),
    score: isNaN(item.score) ? 0 : Math.max(0, Math.min(100, item.score)),
    optimal: isNaN(item.optimal) ? 0 : Math.max(0, Math.min(100, item.optimal)),
    fullMark: 100
  }));
  console.log('[TeamComposition] radarData after validation:', validRadarData);

  const dynamicsData = [
    { name: 'Innovation', value: Number((analysis.dynamics?.innovationPotential || 0) * 100) || 0, color: '#3b82f6' },
    { name: 'Execution', value: Number((analysis.dynamics?.executionCapability || 0) * 100) || 0, color: '#22c55e' },
    { name: 'Communication', value: Number((analysis.dynamics?.communicationEfficiency || 0) * 100) || 0, color: '#a855f7' },
    { name: 'Adaptability', value: Number((analysis.dynamics?.adaptabilityScore || 0) * 100) || 0, color: '#f97316' },
    { name: 'Reliability', value: Number((analysis.dynamics?.reliabilityScore || 0) * 100) || 0, color: '#14b8a6' }
  ];

  // Validate dynamicsData
  console.log('[TeamComposition] dynamicsData before validation:', dynamicsData);
  const validDynamicsData = dynamicsData.map(item => ({
    ...item,
    name: String(item.name || ''),
    value: isNaN(item.value) ? 0 : Math.max(0, Math.min(100, item.value)),
    color: item.color || '#000000'
  }));
  console.log('[TeamComposition] dynamicsData after validation:', validDynamicsData);

  const priorityColors = {
    high: 'bg-red-100 text-red-700 border-red-300',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    low: 'bg-blue-100 text-blue-700 border-blue-300'
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Diversity Score</p>
                <p className="text-3xl font-bold text-blue-600">
                  {Math.round(analysis.diversityScore * 100)}%
                </p>
              </div>
              <Users className="w-10 h-10 text-blue-600" />
            </div>
            <Progress value={analysis.diversityScore * 100} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Innovation</p>
                <p className="text-3xl font-bold text-purple-600">
                  {Math.round(analysis.dynamics.innovationPotential * 100)}%
                </p>
              </div>
              <Lightbulb className="w-10 h-10 text-purple-600" />
            </div>
            <Progress value={analysis.dynamics.innovationPotential * 100} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Execution</p>
                <p className="text-3xl font-bold text-green-600">
                  {Math.round(analysis.dynamics.executionCapability * 100)}%
                </p>
              </div>
              <Target className="w-10 h-10 text-green-600" />
            </div>
            <Progress value={analysis.dynamics.executionCapability * 100} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conflict Risk</p>
                <p className="text-3xl font-bold text-orange-600">
                  {Math.round(analysis.dynamics.conflictRisk * 100)}%
                </p>
              </div>
              <AlertCircle className="w-10 h-10 text-orange-600" />
            </div>
            <Progress value={analysis.dynamics.conflictRisk * 100} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Team Personality Profile</CardTitle>
            <CardDescription>
              Average scores vs. optimal ranges
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={validRadarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis 
                  dataKey="trait" 
                  tick={{ fill: '#374151', fontSize: 12, fontWeight: '600' }}
                />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} />
                <Radar 
                  name="Team Average" 
                  dataKey="score" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6} 
                />
                <Radar 
                  name="Optimal Range" 
                  dataKey="optimal" 
                  stroke="#22c55e" 
                  fill="#22c55e" 
                  fillOpacity={0.2} 
                  strokeDasharray="5 5"
                />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Team Dynamics */}
        <Card>
          <CardHeader>
            <CardTitle>Predicted Team Dynamics</CardTitle>
            <CardDescription>
              Calculated from personality composition
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={validDynamicsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {validDynamicsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Strengths and Gaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Team Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.strengths.length > 0 ? (
              <ul className="space-y-2">
                {analysis.strengths.map((strength: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <Zap className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">Team has balanced scores across all traits</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Areas for Development
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.gaps.length > 0 ? (
              <ul className="space-y-2">
                {analysis.gaps.map((gap: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <Target className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{gap}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No significant gaps identified</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Strategic Recommendations
            </span>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </CardTitle>
          <CardDescription>
            Actions to optimize team performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.recommendations.map((rec: any, index: number) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border-2 ${priorityColors[rec.priority as keyof typeof priorityColors]}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={priorityColors[rec.priority as keyof typeof priorityColors]}>
                      {rec.priority.toUpperCase()}
                    </Badge>
                    <h4 className="font-semibold">{rec.title}</h4>
                  </div>
                  <Badge variant="outline">{rec.type}</Badge>
                </div>
                <p className="text-sm mb-2">{rec.description}</p>
                <div className="flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4" />
                  <span className="font-medium">Action:</span>
                  <span>{rec.action}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Methodology Note */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Brain className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-blue-900">About This Analysis</p>
              <p className="text-blue-800">
                This composition analysis is based on the Big Five personality model and validated research on team performance. 
                Scores are calculated from {analysis.completedCount} of {analysis.teamSize} team members who have completed assessments.
              </p>
              <p className="text-blue-700 text-xs">
                For most accurate insights, aim for 80%+ team completion rate.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamCompositionAnalyzer;




