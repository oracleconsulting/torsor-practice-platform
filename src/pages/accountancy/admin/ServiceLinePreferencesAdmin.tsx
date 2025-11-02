/**
 * Service Line Preferences Admin Dashboard
 * Collates all team members' service line rankings, experience, and interest levels
 * Essential for deriving optimized training strategies and service line go-to-market decisions
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase/client';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { generateServiceLineDeployment } from '@/lib/api/advanced-analysis';
import { useToast } from '@/components/ui/use-toast';
import { 
  TrendingUp, 
  Users, 
  Award, 
  BarChart3,
  Target,
  Download,
  RefreshCw,
  Brain,
  Loader2,
  Rocket
} from 'lucide-react';
import { 
  BSG_SERVICE_LINES, 
  type ServiceLineInterest 
} from '@/lib/api/service-line-interests';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface MemberPreference {
  memberId: string;
  memberName: string;
  role: string;
  serviceLine: string;
  interestRank: number;
  experienceLevel: number;
  desiredInvolvement: number;
  notes: string;
}

interface ServiceLineSummary {
  serviceLine: string;
  totalInterested: number;
  avgRank: number;
  avgExperience: number;
  totalDesiredInvolvement: number;
  topContributors: { name: string; role: string; experience: number; involvement: number }[];
}

const ServiceLinePreferencesAdmin: React.FC = () => {
  const { practice } = useAccountancyContext();
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [preferences, setPreferences] = useState<MemberPreference[]>([]);
  const [summaries, setSummaries] = useState<ServiceLineSummary[]>([]);
  const [selectedServiceLine, setSelectedServiceLine] = useState<string | null>(null);
  
  // Phase 2 AI Feature
  const [deploymentStrategy, setDeploymentStrategy] = useState<string | null>(null);
  const [generatingStrategy, setGeneratingStrategy] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (practice?.id) {
      loadData();
    }
  }, [practice?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load team members
      const { data: members, error: membersError } = await supabase
        .from('practice_members')
        .select('id, name, email, role')
        .eq('practice_id', practice?.id)
        .order('name');

      if (membersError) {
        console.error('[ServiceLinePreferencesAdmin] Error loading members:', membersError);
        return;
      }

      setTeamMembers(members || []);

      // Load all service line interests
      const { data: interests, error: interestsError } = await supabase
        .from('service_line_interests')
        .select('*')
        .in('practice_member_id', (members || []).map(m => m.id));

      if (interestsError) {
        console.error('[ServiceLinePreferencesAdmin] Error loading interests:', interestsError);
        return;
      }

      // Map interests to member preferences
      const memberPrefs: MemberPreference[] = [];
      (interests || []).forEach((interest: ServiceLineInterest) => {
        const member = members?.find(m => m.id === interest.practice_member_id);
        if (member) {
          memberPrefs.push({
            memberId: member.id,
            memberName: member.name,
            role: member.role,
            serviceLine: interest.service_line,
            interestRank: interest.interest_rank,
            experienceLevel: interest.current_experience_level,
            desiredInvolvement: interest.desired_involvement_pct,
            notes: interest.notes || ''
          });
        }
      });

      setPreferences(memberPrefs);

      // Calculate summaries
      const summariesMap = new Map<string, ServiceLineSummary>();
      BSG_SERVICE_LINES.forEach(serviceLine => {
        const servicePrefs = memberPrefs.filter(p => p.serviceLine === serviceLine);
        
        if (servicePrefs.length === 0) {
          summariesMap.set(serviceLine, {
            serviceLine,
            totalInterested: 0,
            avgRank: 0,
            avgExperience: 0,
            totalDesiredInvolvement: 0,
            topContributors: []
          });
          return;
        }

        const avgRank = servicePrefs.reduce((sum, p) => sum + p.interestRank, 0) / servicePrefs.length;
        const avgExperience = servicePrefs.reduce((sum, p) => sum + p.experienceLevel, 0) / servicePrefs.length;
        const totalDesiredInvolvement = servicePrefs.reduce((sum, p) => sum + p.desiredInvolvement, 0);

        const topContributors = servicePrefs
          .sort((a, b) => {
            // Sort by interest rank (lower is better) and experience (higher is better)
            const rankDiff = a.interestRank - b.interestRank;
            if (rankDiff !== 0) return rankDiff;
            return b.experienceLevel - a.experienceLevel;
          })
          .slice(0, 5)
          .map(p => ({
            name: p.memberName,
            role: p.role,
            experience: p.experienceLevel,
            involvement: p.desiredInvolvement
          }));

        summariesMap.set(serviceLine, {
          serviceLine,
          totalInterested: servicePrefs.length,
          avgRank,
          avgExperience,
          totalDesiredInvolvement,
          topContributors
        });
      });

      setSummaries(Array.from(summariesMap.values()));
    } catch (error) {
      console.error('[ServiceLinePreferencesAdmin] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getServiceLineIcon = (serviceLine: string) => {
    const icons: Record<string, string> = {
      'Automation': '🔄',
      'Management Accounts': '📊',
      'Future Financial Information / Advisory Accelerator': '💼',
      'Benchmarking - External and Internal': '⚖️',
      'Profit Extraction / Remuneration Strategies': '💰',
      '365 Alignment Programme': '🎯',
      'Systems Audit': '🔍',
      'Fractional CFO Services': '💼',
      'Fractional COO Services': '⚙️',
      'Combined CFO/COO Advisory': '🚀'
    };
    return icons[serviceLine] || '📌';
  };

  const getExperienceLabel = (level: number) => {
    const labels = ['None', 'Beginner', 'Basic', 'Intermediate', 'Proficient', 'Expert'];
    return labels[level] || 'None';
  };

  const getExperienceColor = (level: number) => {
    if (level >= 4) return 'text-green-600 bg-green-100';
    if (level >= 2) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const exportToCSV = () => {
    const headers = ['Member', 'Role', 'Service Line', 'Interest Rank', 'Experience Level', 'Desired Involvement %', 'Notes'];
    const rows = preferences.map(p => [
      p.memberName,
      p.role,
      p.serviceLine,
      p.interestRank.toString(),
      getExperienceLabel(p.experienceLevel),
      p.desiredInvolvement.toString(),
      p.notes.replace(/,/g, ';')
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `service-line-preferences-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Phase 2 AI Feature - Manual Trigger Handler
  const handleGenerateDeploymentStrategy = async () => {
    if (!practice?.id) {
      toast({
        title: 'Error',
        description: 'Practice ID not found',
        variant: 'destructive'
      });
      return;
    }

    setGeneratingStrategy(true);
    try {
      const result = await generateServiceLineDeployment(practice.id);
      setDeploymentStrategy(result.strategy);
      toast({
        title: 'Deployment Strategy Complete!',
        description: 'AI-powered go-to-market strategy has been generated.',
      });
    } catch (error: any) {
      console.error('[ServiceLinePreferences] Error generating strategy:', error);
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate strategy. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setGeneratingStrategy(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading service line preferences...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            Service Line Preferences
          </h1>
          <p className="text-gray-600 mt-2">
            Team interest rankings, experience levels, and desired involvement across all service lines
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={loadData}
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={exportToCSV}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Team Members</p>
                <p className="text-3xl font-bold text-blue-900">{teamMembers.length}</p>
              </div>
              <Users className="w-10 h-10 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Service Lines</p>
                <p className="text-3xl font-bold text-green-900">{BSG_SERVICE_LINES.length}</p>
              </div>
              <BarChart3 className="w-10 h-10 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">Preferences Recorded</p>
                <p className="text-3xl font-bold text-amber-900">{preferences.length}</p>
              </div>
              <Award className="w-10 h-10 text-amber-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Avg. Response Rate</p>
                <p className="text-3xl font-bold text-purple-900">
                  {teamMembers.length > 0 
                    ? Math.round((preferences.length / (teamMembers.length * BSG_SERVICE_LINES.length)) * 100)
                    : 0}%
                </p>
              </div>
              <Target className="w-10 h-10 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="by-service" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="by-service">By Service Line</TabsTrigger>
          <TabsTrigger value="by-member">By Team Member</TabsTrigger>
          <TabsTrigger value="recommendations">Strategic Insights</TabsTrigger>
        </TabsList>

        {/* By Service Line Tab */}
        <TabsContent value="by-service" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {summaries.map((summary) => (
              <Card key={summary.serviceLine} className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <span className="text-2xl">{getServiceLineIcon(summary.serviceLine)}</span>
                      {summary.serviceLine}
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedServiceLine(
                        selectedServiceLine === summary.serviceLine ? null : summary.serviceLine
                      )}
                    >
                      {selectedServiceLine === summary.serviceLine ? 'Hide Details' : 'View Details'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs text-blue-700 font-medium">Interested Members</p>
                      <p className="text-2xl font-bold text-blue-900">{summary.totalInterested}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-xs text-green-700 font-medium">Avg. Interest Rank</p>
                      <p className="text-2xl font-bold text-green-900">{summary.avgRank.toFixed(1)}</p>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-lg">
                      <p className="text-xs text-amber-700 font-medium">Avg. Experience</p>
                      <p className="text-2xl font-bold text-amber-900">{summary.avgExperience.toFixed(1)}/5</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="text-xs text-purple-700 font-medium">Total Desired %</p>
                      <p className="text-2xl font-bold text-purple-900">{summary.totalDesiredInvolvement}%</p>
                    </div>
                  </div>

                  {/* Top Contributors */}
                  {summary.topContributors.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Top Contributors</h4>
                      <div className="flex flex-wrap gap-2">
                        {summary.topContributors.map((contributor, idx) => (
                          <Badge 
                            key={idx}
                            variant="outline"
                            className="py-1 px-3 text-sm"
                          >
                            {contributor.name} ({contributor.role}) - 
                            <span className={`ml-1 font-semibold ${getExperienceColor(contributor.experience)}`}>
                              {getExperienceLabel(contributor.experience)}
                            </span>
                            {contributor.involvement > 0 && (
                              <span className="ml-1 text-gray-600">
                                • {contributor.involvement}%
                              </span>
                            )}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Detailed View */}
                  {selectedServiceLine === summary.serviceLine && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">All Team Members' Preferences</h4>
                      <div className="space-y-2">
                        {preferences
                          .filter(p => p.serviceLine === summary.serviceLine)
                          .sort((a, b) => a.interestRank - b.interestRank)
                          .map((pref, idx) => (
                            <div 
                              key={idx} 
                              className="flex items-center justify-between bg-gray-50 p-3 rounded-lg text-sm"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <Badge className="w-8 h-8 rounded-full flex items-center justify-center">
                                  {pref.interestRank}
                                </Badge>
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900">{pref.memberName}</p>
                                  <p className="text-xs text-gray-600">{pref.role}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-right">
                                <div>
                                  <p className="text-xs text-gray-600">Experience</p>
                                  <Badge className={getExperienceColor(pref.experienceLevel)}>
                                    {getExperienceLabel(pref.experienceLevel)}
                                  </Badge>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">Desired %</p>
                                  <p className="font-bold text-purple-700">{pref.desiredInvolvement}%</p>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* By Team Member Tab */}
        <TabsContent value="by-member" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {teamMembers.map((member) => {
              const memberPrefs = preferences.filter(p => p.memberId === member.id).sort((a, b) => a.interestRank - b.interestRank);
              const topThree = memberPrefs.slice(0, 3);
              
              return (
                <Card key={member.id} className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <div>
                        <span className="text-gray-900">{member.name}</span>
                        <Badge variant="outline" className="ml-2">{member.role}</Badge>
                      </div>
                      <span className="text-sm text-gray-600">
                        {memberPrefs.length} / {BSG_SERVICE_LINES.length} preferences recorded
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {topThree.length > 0 ? (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Top 3 Service Line Interests</h4>
                        <div className="space-y-2">
                          {topThree.map((pref, idx) => (
                            <div 
                              key={idx}
                              className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-lg"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <Badge className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-600">
                                  {pref.interestRank}
                                </Badge>
                                <div>
                                  <p className="font-semibold text-gray-900">
                                    {getServiceLineIcon(pref.serviceLine)} {pref.serviceLine}
                                  </p>
                                  {pref.notes && (
                                    <p className="text-xs text-gray-600 mt-1">{pref.notes}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-right">
                                <div>
                                  <p className="text-xs text-gray-600">Experience</p>
                                  <Badge className={getExperienceColor(pref.experienceLevel)}>
                                    {getExperienceLabel(pref.experienceLevel)}
                                  </Badge>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">Desired %</p>
                                  <p className="font-bold text-purple-700">{pref.desiredInvolvement}%</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No preferences recorded yet</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Strategic Insights Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          {/* Phase 2: AI-Powered Service Line Deployment Strategy */}
          <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Rocket className="w-6 h-6 text-indigo-600" />
                    AI-Powered Deployment Strategy
                  </CardTitle>
                  <CardDescription>
                    Strategic go-to-market recommendations based on team capacity, skills, and interest
                  </CardDescription>
                </div>
                <Button
                  onClick={handleGenerateDeploymentStrategy}
                  disabled={generatingStrategy}
                  variant="outline"
                  className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                >
                  {generatingStrategy ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      {deploymentStrategy ? 'Regenerate Strategy' : 'Generate Strategy'}
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            {generatingStrategy ? (
              <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium text-indigo-900">Analyzing Service Line Deployment</p>
                  <p className="text-sm text-gray-600">Matching team capacity to market opportunities...</p>
                  <p className="text-xs text-gray-500">This may take 20-40 seconds</p>
                </div>
              </CardContent>
            ) : deploymentStrategy ? (
              <CardContent className="space-y-6">
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">{deploymentStrategy}</div>
                </div>
              </CardContent>
            ) : (
              <CardContent className="flex flex-col items-center justify-center py-8 space-y-2">
                <p className="text-sm text-gray-600">Click "Generate Strategy" to create AI-powered deployment recommendations</p>
              </CardContent>
            )}
          </Card>

          <Card className="border-2 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-6 h-6 text-purple-600" />
                Strategic Training & Go-To-Market Insights
              </CardTitle>
              <CardDescription>
                Data-driven recommendations based on team preferences and capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* High Interest, Low Experience - Training Priority */}
              <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                <h3 className="text-lg font-bold text-amber-900 mb-3 flex items-center gap-2">
                  🎯 Training Priorities (High Interest, Low Experience)
                </h3>
                <div className="space-y-2">
                  {summaries
                    .filter(s => s.avgRank <= 5 && s.avgExperience < 2.5 && s.totalInterested >= 3)
                    .sort((a, b) => a.avgRank - b.avgRank)
                    .map((summary) => (
                      <div key={summary.serviceLine} className="bg-white p-3 rounded-lg">
                        <p className="font-semibold text-gray-900">
                          {getServiceLineIcon(summary.serviceLine)} {summary.serviceLine}
                        </p>
                        <p className="text-sm text-gray-600">
                          {summary.totalInterested} team members interested (Avg rank: {summary.avgRank.toFixed(1)}) 
                          but low experience (Avg: {summary.avgExperience.toFixed(1)}/5)
                        </p>
                        <p className="text-xs text-amber-700 mt-1 font-medium">
                          💡 Invest in training to unlock this high-interest area
                        </p>
                      </div>
                    ))}
                </div>
              </div>

              {/* High Experience, High Interest - Ready for Market */}
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center gap-2">
                  🚀 Ready for Go-To-Market (High Interest, High Experience)
                </h3>
                <div className="space-y-2">
                  {summaries
                    .filter(s => s.avgRank <= 5 && s.avgExperience >= 3 && s.totalInterested >= 2)
                    .sort((a, b) => b.avgExperience - a.avgExperience)
                    .map((summary) => (
                      <div key={summary.serviceLine} className="bg-white p-3 rounded-lg">
                        <p className="font-semibold text-gray-900">
                          {getServiceLineIcon(summary.serviceLine)} {summary.serviceLine}
                        </p>
                        <p className="text-sm text-gray-600">
                          {summary.totalInterested} experienced team members ({summary.avgExperience.toFixed(1)}/5 avg) 
                          with strong interest (Rank: {summary.avgRank.toFixed(1)})
                        </p>
                        <p className="text-xs text-green-700 mt-1 font-medium">
                          ✅ Team is ready - prioritize this service line for growth
                        </p>
                      </div>
                    ))}
                </div>
              </div>

              {/* Low Interest - Consider De-prioritizing */}
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-bold text-red-900 mb-3 flex items-center gap-2">
                  ⚠️ Low Team Interest (Consider De-prioritizing)
                </h3>
                <div className="space-y-2">
                  {summaries
                    .filter(s => s.avgRank > 7 || s.totalInterested < 3)
                    .sort((a, b) => b.avgRank - a.avgRank)
                    .map((summary) => (
                      <div key={summary.serviceLine} className="bg-white p-3 rounded-lg">
                        <p className="font-semibold text-gray-900">
                          {getServiceLineIcon(summary.serviceLine)} {summary.serviceLine}
                        </p>
                        <p className="text-sm text-gray-600">
                          Low team engagement: {summary.totalInterested} members interested (Avg rank: {summary.avgRank.toFixed(1)})
                        </p>
                        <p className="text-xs text-red-700 mt-1 font-medium">
                          💭 May need repositioning, external hiring, or strategic de-emphasis
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServiceLinePreferencesAdmin;

