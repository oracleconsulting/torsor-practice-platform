/**
 * Team Assessment Dashboard (Admin View)
 * Combined VARK + OCEAN scores for entire practice
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, Brain, CheckCircle, Clock, Search, Download, 
  TrendingUp, AlertCircle, Filter, Eye
} from 'lucide-react';
import { getPracticeTeamProfiles } from '@/lib/api/personality-assessment';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Bar, BarChart, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';

interface TeamAssessmentDashboardProps {
  practiceId: string;
}

export const TeamAssessmentDashboard: React.FC<TeamAssessmentDashboardProps> = ({ practiceId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');

  useEffect(() => {
    loadTeamData();
  }, [practiceId]);

  const loadTeamData = async () => {
    setLoading(true);
    try {
      const data = await getPracticeTeamProfiles(practiceId);
      setTeamData(data);
    } catch (error) {
      console.error('[Team Assessment Dashboard] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = teamData.filter(member => {
    const matchesSearch = member.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || member.assessment_status === filterStatus;
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const stats = {
    total: teamData.length,
    complete: teamData.filter(m => m.assessment_status === 'complete').length,
    partial: teamData.filter(m => m.assessment_status === 'partial').length,
    notStarted: teamData.filter(m => m.assessment_status === 'not_started').length,
    varkOnly: teamData.filter(m => m.vark_completed && !m.ocean_completed).length,
    oceanOnly: teamData.filter(m => !m.vark_completed && m.ocean_completed).length
  };

  const completionRate = teamData.length > 0 ? Math.round((stats.complete / stats.total) * 100) : 0;

  // Calculate team averages for OCEAN
  const teamAverages = {
    openness: Math.round(teamData.filter(m => m.openness_score).reduce((sum, m) => sum + m.openness_score, 0) / teamData.filter(m => m.openness_score).length || 0),
    conscientiousness: Math.round(teamData.filter(m => m.conscientiousness_score).reduce((sum, m) => sum + m.conscientiousness_score, 0) / teamData.filter(m => m.conscientiousness_score).length || 0),
    extraversion: Math.round(teamData.filter(m => m.extraversion_score).reduce((sum, m) => sum + m.extraversion_score, 0) / teamData.filter(m => m.extraversion_score).length || 0),
    agreeableness: Math.round(teamData.filter(m => m.agreeableness_score).reduce((sum, m) => sum + m.agreeableness_score, 0) / teamData.filter(m => m.agreeableness_score).length || 0),
    emotionalStability: Math.round(teamData.filter(m => m.emotional_stability_score).reduce((sum, m) => sum + m.emotional_stability_score, 0) / teamData.filter(m => m.emotional_stability_score).length || 0)
  };

  const teamRadarData = [
    { trait: 'Openness', score: teamAverages.openness, fullMark: 100 },
    { trait: 'Conscientiousness', score: teamAverages.conscientiousness, fullMark: 100 },
    { trait: 'Extraversion', score: teamAverages.extraversion, fullMark: 100 },
    { trait: 'Agreeableness', score: teamAverages.agreeableness, fullMark: 100 },
    { trait: 'Emotional\nStability', score: teamAverages.emotionalStability, fullMark: 100 }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <Badge className="bg-green-600">Complete</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-600">Partial</Badge>;
      case 'not_started':
        return <Badge variant="outline">Not Started</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getRoleDistribution = () => {
    const roleCount: Record<string, number> = {};
    teamData.forEach(member => {
      roleCount[member.role] = (roleCount[member.role] || 0) + 1;
    });
    return Object.entries(roleCount).map(([role, count]) => ({ role, count }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading team assessment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Assessments</h1>
          <p className="text-gray-600 mt-1">
            VARK Learning Styles + OCEAN Personality Profiles
          </p>
        </div>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Team Members</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users className="w-10 h-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Both Complete</p>
                <p className="text-3xl font-bold text-green-600">{stats.complete}</p>
                <p className="text-xs text-gray-500 mt-1">{completionRate}% completion rate</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Partial Complete</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.partial}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.varkOnly} VARK only, {stats.oceanOnly} OCEAN only
                </p>
              </div>
              <Clock className="w-10 h-10 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Not Started</p>
                <p className="text-3xl font-bold text-gray-600">{stats.notStarted}</p>
                <p className="text-xs text-gray-500 mt-1">Need to complete</p>
              </div>
              <AlertCircle className="w-10 h-10 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">
            <Users className="w-4 h-4 mr-2" />
            Team List
          </TabsTrigger>
          <TabsTrigger value="composition">
            <TrendingUp className="w-4 h-4 mr-2" />
            Team Composition
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Brain className="w-4 h-4 mr-2" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Team List Tab */}
        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="not_started">Not Started</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {getRoleDistribution().map(({ role }) => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Team Member Table */}
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Member</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">VARK</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">OCEAN</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((member) => (
                      <tr key={member.member_id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{member.member_name}</p>
                            <p className="text-sm text-gray-500">{member.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{member.role}</Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {member.vark_completed ? (
                            <div>
                              <CheckCircle className="w-5 h-5 text-green-600 inline" />
                              <p className="text-xs text-gray-600 mt-1">
                                {member.learning_style}
                              </p>
                            </div>
                          ) : (
                            <Clock className="w-5 h-5 text-gray-400 inline" />
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {member.ocean_completed ? (
                            <div>
                              <CheckCircle className="w-5 h-5 text-green-600 inline" />
                              <p className="text-xs text-gray-600 mt-1">
                                {member.work_style}
                              </p>
                            </div>
                          ) : (
                            <Clock className="w-5 h-5 text-gray-400 inline" />
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {getStatusBadge(member.assessment_status)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/admin/team/${member.member_id}/profile`)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredData.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No team members found matching your filters.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Composition Tab */}
        <TabsContent value="composition" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team Personality Average */}
            <Card>
              <CardHeader>
                <CardTitle>Team Personality Profile</CardTitle>
                <CardDescription>
                  Average Big Five scores across team members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart data={teamRadarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis 
                      dataKey="trait" 
                      tick={{ fill: '#374151', fontSize: 12, fontWeight: 600 }}
                    />
                    <PolarRadiusAxis 
                      domain={[0, 100]} 
                      tick={{ fill: '#6b7280', fontSize: 10 }}
                    />
                    <Radar 
                      name="Team Average" 
                      dataKey="score" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.6} 
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Learning Style Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Learning Style Distribution</CardTitle>
                <CardDescription>
                  VARK assessment results breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['visual', 'auditory', 'reading_writing', 'kinesthetic'].map(style => {
                    const count = teamData.filter(m => m.learning_style === style).length;
                    const percentage = teamData.length > 0 ? Math.round((count / teamData.length) * 100) : 0;
                    
                    return (
                      <div key={style}>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {style.replace('_', ' ')}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Work Style Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Work Style Distribution</CardTitle>
              <CardDescription>
                Distribution of work styles across the team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={Object.entries(
                    teamData.reduce((acc: Record<string, number>, m) => {
                      if (m.work_style) {
                        acc[m.work_style] = (acc[m.work_style] || 0) + 1;
                      }
                      return acc;
                    }, {})
                  ).map(([style, count]) => ({ 
                    style: style.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
                    count 
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="style" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Composition Insights</CardTitle>
              <CardDescription>
                Analysis and recommendations based on team profiles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Completion Status Insights */}
              <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded-r-lg">
                <h4 className="font-semibold text-yellow-900 mb-2">📊 Assessment Coverage</h4>
                <p className="text-sm text-yellow-800">
                  {completionRate < 50 ? (
                    `Only ${completionRate}% of team members have completed both assessments. Consider sending reminders to increase participation.`
                  ) : completionRate < 80 ? (
                    `Good progress with ${completionRate}% completion rate. A few more team members need to complete their assessments.`
                  ) : (
                    `Excellent! ${completionRate}% completion rate means you have comprehensive team data for strategic planning.`
                  )}
                </p>
              </div>

              {/* Diversity Insights */}
              {teamAverages.openness > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Team Strengths & Opportunities:</h4>
                  
                  {teamAverages.openness > 70 && (
                    <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                      <p className="text-sm text-blue-900">
                        <strong>💡 High Innovation Potential:</strong> Your team scores high on Openness ({teamAverages.openness}/100). 
                        Great for innovation projects and adapting to change.
                      </p>
                    </div>
                  )}
                  
                  {teamAverages.conscientiousness > 70 && (
                    <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
                      <p className="text-sm text-green-900">
                        <strong>✅ Strong Execution:</strong> High Conscientiousness ({teamAverages.conscientiousness}/100) 
                        means reliable delivery and attention to detail.
                      </p>
                    </div>
                  )}
                  
                  {teamAverages.extraversion < 40 && (
                    <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg">
                      <p className="text-sm text-purple-900">
                        <strong>🤫 Introverted Team:</strong> Lower Extraversion ({teamAverages.extraversion}/100) suggests 
                        preference for independent work. Ensure adequate quiet workspace and async communication options.
                      </p>
                    </div>
                  )}
                  
                  {teamAverages.agreeableness > 70 && (
                    <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
                      <p className="text-sm text-orange-900">
                        <strong>🤝 Highly Collaborative:</strong> High Agreeableness ({teamAverages.agreeableness}/100) 
                        creates positive team dynamics. Watch for groupthink - encourage diverse perspectives.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamAssessmentDashboard;

