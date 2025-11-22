import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, 
  Target, Users, DollarSign, Calendar, Download, RefreshCw,
  Zap, Award, BookOpen, BarChart3, Activity, Loader2
} from 'lucide-react';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { supabase } from '@/lib/supabase/client';
import { advisoryServicesMap, ServiceLine } from '@/lib/advisory-services-skills-mapping';
import { useToast } from '@/components/ui/use-toast';

// ====================================================================
// REAL DATA INTERFACES (from skill_assessments table)
// ====================================================================

interface SkillAggregation {
  skillId: string;
  skillName: string;
  category: string;
  serviceLine: string[];
  requiredLevel: number | null;
  teamCount: number;
  avgLevel: number;
  avgInterest: number;
  minLevel: number;
  maxLevel: number;
}

interface ServiceReadiness {
  service: ServiceLine;
  interest: number; // Average team interest (1-5) * 20 = percentage
  skillsReadiness: number; // Percentage of required skills met
  gap: number;
  status: 'ready' | 'partial' | 'not-ready';
  weeksToReady: number;
  capableMembers: number;
  criticalGaps: string[];
  trainingInvestment: number;
  revenueEnabled: number;
}

interface SkillGap {
  skillName: string;
  teamAverage: number;
  requiredLevel: number;
  gap: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  servicesBlocked: string[];
  peopleNeed: number;
  trainingCost: number;
}

const ServiceReadinessDashboard: React.FC = () => {
  const { practice } = useAccountancyContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [skillsOverview, setSkillsOverview] = useState<SkillAggregation[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadRealData();
  }, [practice?.id]);

  // ====================================================================
  // LOAD REAL DATA (using proven pattern from team-portal.ts)
  // ====================================================================

  const loadRealData = async () => {
    if (!practice?.id) return;

    try {
      setLoading(true);

      // Step 1: Get non-test members ONLY
      const { data: realMembers, error: membersError } = await supabase
        .from('practice_members')
        .select('id')
        .eq('practice_id', practice.id)
        .or('is_test_account.is.null,is_test_account.eq.false');
      
      if (membersError) throw membersError;
      
      const realMemberIds = realMembers?.map(m => m.id) || [];
      
      if (realMemberIds.length === 0) {
        toast({
          title: 'No Team Members',
          description: 'No active team members found for analysis.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
      
      // Step 2: Get assessments ONLY for real members with skill details
      const { data, error } = await supabase
        .from('skill_assessments')
        .select(`
          skill_id,
          current_level,
          interest_level,
          skill:skills(name, category, service_line, required_level)
        `)
        .in('team_member_id', realMemberIds);
        
      if (error) throw error;
      
      // Step 3: Group by skill and calculate aggregates (EXACTLY like team-portal.ts)
      const skillMap = new Map<string, any>();
      
      data?.forEach((assessment: any) => {
        const skillId = assessment.skill_id;
        if (!skillMap.has(skillId)) {
          skillMap.set(skillId, {
            skill: assessment.skill,
            levels: [],
            interests: [],
          });
        }
        
        const entry = skillMap.get(skillId);
        entry.levels.push(assessment.current_level);
        entry.interests.push(assessment.interest_level);
      });
      
      // Step 4: Calculate statistics
      const overview = Array.from(skillMap.entries()).map(([skillId, data]) => ({
        skillId,
        skillName: data.skill?.name || 'Unknown',
        category: data.skill?.category || 'Uncategorized',
        serviceLine: data.skill?.service_line || [],
        requiredLevel: data.skill?.required_level,
        teamCount: data.levels.length,
        avgLevel: data.levels.reduce((a: number, b: number) => a + b, 0) / data.levels.length,
        avgInterest: data.interests.reduce((a: number, b: number) => a + b, 0) / data.interests.length,
        minLevel: Math.min(...data.levels),
        maxLevel: Math.max(...data.levels),
      }));

      setSkillsOverview(overview);

      console.log('✅ [ServiceReadiness] REAL DATA Loaded:', {
        members: realMemberIds.length,
        assessments: data?.length,
        uniqueSkills: overview.length,
        avgSkillLevel: (overview.reduce((sum, s) => sum + s.avgLevel, 0) / overview.length).toFixed(2),
        avgInterest: (overview.reduce((sum, s) => sum + s.avgInterest, 0) / overview.length).toFixed(2)
      });

    } catch (error: any) {
      console.error('❌ [ServiceReadiness] Load error:', error);
      toast({
        title: 'Error Loading Data',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // ====================================================================
  // CALCULATE SERVICE READINESS (using REAL skill assessments)
  // ====================================================================

  const serviceReadiness = useMemo((): ServiceReadiness[] => {
    if (skillsOverview.length === 0) return [];

    return advisoryServicesMap.map(service => {
      let totalInterest = 0;
      let totalSkillMatch = 0;
      let totalRequiredSkills = service.requiredSkills.length;
      let skillsAssessed = 0;

      // For each required skill in this service
      service.requiredSkills.forEach(requiredSkill => {
        // Find the skill in our aggregated data
        const skillData = skillsOverview.find(s => s.skillName === requiredSkill.skillName);
        
        if (skillData) {
          skillsAssessed++;
          totalInterest += skillData.avgInterest;
          
          // Check if team average meets minimum requirement
          if (skillData.avgLevel >= requiredSkill.minimumLevel) {
            totalSkillMatch++;
          }
        }
      });

      // Calculate percentages
      const interestPercentage = skillsAssessed > 0 
        ? (totalInterest / skillsAssessed / 5) * 100 // Interest is 1-5 scale
        : 0;
      
      const skillsReadinessPercentage = totalRequiredSkills > 0
        ? (totalSkillMatch / totalRequiredSkills) * 100
        : 0;

      const gap = interestPercentage - skillsReadinessPercentage;

      // Determine status and weeks to ready
      let status: 'ready' | 'partial' | 'not-ready' = 'not-ready';
      let weeksToReady = 12;
      
      if (skillsReadinessPercentage >= 80) {
        status = 'ready';
        weeksToReady = 0;
      } else if (skillsReadinessPercentage >= 60) {
        status = 'partial';
        weeksToReady = 4;
      } else if (skillsReadinessPercentage >= 40) {
        weeksToReady = 6;
      } else {
        weeksToReady = 12;
      }

      // Identify critical gaps (skills where team avg is below minimum)
      const criticalGaps = service.requiredSkills
        .filter(req => {
          const skillData = skillsOverview.find(s => s.skillName === req.skillName);
          return skillData && skillData.avgLevel < req.minimumLevel && req.criticalToDelivery;
        })
        .map(req => req.skillName)
        .slice(0, 3);

      // Calculate training investment based on gap
      const trainingInvestment = Math.round(gap * 200); // £200 per percentage point gap

      // Estimate revenue (this should come from service pricing data)
      const revenueEnabled = service.id === 'management-accounts' ? 40000 
        : service.id === '365-alignment' ? 18000
        : service.id === 'profit-extraction' ? 16000
        : service.id === 'advisory-accelerator' ? 15000
        : service.id === 'automation' ? 12000
        : service.id === 'benchmarking' ? 10000
        : 8000;

      return {
        service,
        interest: Math.round(interestPercentage),
        skillsReadiness: Math.round(skillsReadinessPercentage),
        gap: Math.round(gap),
        status,
        weeksToReady,
        capableMembers: skillsAssessed,
        criticalGaps,
        trainingInvestment,
        revenueEnabled,
      };
    });
  }, [skillsOverview]);

  // ====================================================================
  // CALCULATE CRITICAL SKILL GAPS (using REAL data)
  // ====================================================================

  const criticalSkillGaps = useMemo((): SkillGap[] => {
    if (skillsOverview.length === 0) return [];

    // Get all unique skills across all services
    const allRequiredSkills = new Set<string>();
    advisoryServicesMap.forEach(service => {
      service.requiredSkills.forEach(req => allRequiredSkills.add(req.skillName));
    });

    const gaps: SkillGap[] = [];

    allRequiredSkills.forEach(skillName => {
      // Find this skill in our aggregated data
      const skillData = skillsOverview.find(s => s.skillName === skillName);
      if (!skillData) return;

      // Find all services that require this skill
      const servicesRequiring = advisoryServicesMap.filter(service =>
        service.requiredSkills.some(req => req.skillName === skillName)
      );

      // Get the highest required level across all services
      const maxRequiredLevel = Math.max(
        ...servicesRequiring.flatMap(service =>
          service.requiredSkills
            .filter(req => req.skillName === skillName)
            .map(req => req.idealLevel)
        )
      );

      const gap = maxRequiredLevel - skillData.avgLevel;

      // Only include if there's actually a gap
      if (gap <= 0) return;

      // Determine priority
      let priority: 'critical' | 'high' | 'medium' | 'low' = 'medium';
      const isCritical = servicesRequiring.some(service =>
        service.requiredSkills.some(req => req.skillName === skillName && req.criticalToDelivery)
      );

      if (isCritical && gap >= 2) priority = 'critical';
      else if (isCritical && gap >= 1) priority = 'high';
      else if (gap >= 2) priority = 'high';

      gaps.push({
        skillName,
        teamAverage: Math.round(skillData.avgLevel * 10) / 10,
        requiredLevel: maxRequiredLevel,
        gap: Math.round(gap * 10) / 10,
        priority,
        servicesBlocked: servicesRequiring.map(s => s.name),
        peopleNeed: skillData.teamCount, // Number of people who have been assessed
        trainingCost: Math.round(gap * 1000), // £1000 per skill level gap
      });
    });

    // Sort by priority and gap
    return gaps.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.gap - a.gap;
    }).slice(0, 10); // Top 10 gaps

  }, [skillsOverview]);

  // ====================================================================
  // AGGREGATE METRICS
  // ====================================================================

  const totalInvestmentNeeded = useMemo(() => {
    return criticalSkillGaps.reduce((sum, gap) => sum + gap.trainingCost, 0);
  }, [criticalSkillGaps]);

  const totalRevenueEnabled = useMemo(() => {
    return serviceReadiness.reduce((sum, service) => sum + service.revenueEnabled, 0);
  }, [serviceReadiness]);

  // ====================================================================
  // RENDER
  // ====================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        <p className="ml-4 text-gray-600">Loading REAL team skills data...</p>
      </div>
    );
  }

  if (skillsOverview.length === 0) {
    return (
      <Card className="border-4 border-red-500">
        <CardHeader>
          <CardTitle className="text-red-900">No Skills Data Found</CardTitle>
          <CardDescription>
            No skill assessments have been completed yet. Team members need to complete their skills assessments first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={loadRealData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-4 border-orange-500 bg-gradient-to-r from-orange-50 to-amber-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-black uppercase flex items-center gap-3">
                <Target className="w-10 h-10 text-orange-600" />
                Service Launch Readiness Analysis
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                Based on {skillsOverview.length} assessed skills from {skillsOverview[0]?.teamCount || 0} team members
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 font-semibold">Total Investment Needed</div>
              <div className="text-4xl font-black text-orange-600">£{(totalInvestmentNeeded / 1000).toFixed(1)}k</div>
              <div className="text-sm text-green-600 font-bold mt-1">
                → £{(totalRevenueEnabled / 1000).toFixed(0)}k MRR Enabled
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <div className="text-2xl font-black">
                  {serviceReadiness.filter(s => s.status === 'ready').length}
                </div>
                <div className="text-sm text-gray-600 font-semibold">Ready to Launch</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-amber-600" />
              <div>
                <div className="text-2xl font-black">
                  {serviceReadiness.filter(s => s.status === 'partial').length}
                </div>
                <div className="text-sm text-gray-600 font-semibold">Need Training</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div>
                <div className="text-2xl font-black">
                  {criticalSkillGaps.filter(g => g.priority === 'critical').length}
                </div>
                <div className="text-sm text-gray-600 font-semibold">Critical Gaps</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <div>
                <div className="text-2xl font-black">
                  {totalInvestmentNeeded > 0 ? Math.round((totalRevenueEnabled / totalInvestmentNeeded) * 10) / 10 : 0}x
                </div>
                <div className="text-sm text-gray-600 font-semibold">6-Month ROI</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 gap-2 bg-gray-100 p-2">
          <TabsTrigger value="overview">Service Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills Heat Map</TabsTrigger>
          <TabsTrigger value="investment">Training Investment</TabsTrigger>
          <TabsTrigger value="data">Raw Data</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Service Launch Readiness Matrix (REAL DATA)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {serviceReadiness.map(service => (
                  <div key={service.service.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold">{service.service.name}</h3>
                        <Badge 
                          className={
                            service.status === 'ready' ? 'bg-green-600' :
                            service.status === 'partial' ? 'bg-amber-600' :
                            'bg-red-600'
                          }
                        >
                          {service.status === 'ready' ? '✓ READY' :
                           service.status === 'partial' ? '⚠ PARTIAL' :
                           '✗ NOT READY'}
                        </Badge>
                        {service.weeksToReady > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {service.weeksToReady} weeks to ready
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Revenue Enabled</div>
                        <div className="text-xl font-black text-green-600">
                          £{(service.revenueEnabled / 1000).toFixed(0)}k
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Interest/Motivation</div>
                        <Progress value={service.interest} className="h-3" />
                        <div className="text-xs font-bold mt-1">{service.interest}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Skills Readiness</div>
                        <Progress value={service.skillsReadiness} className="h-3" />
                        <div className="text-xs font-bold mt-1">{service.skillsReadiness}%</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Gap:</span>
                        <span className={`font-bold ${service.gap > 40 ? 'text-red-600' : service.gap > 20 ? 'text-amber-600' : 'text-green-600'}`}>
                          {service.gap}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Training Investment:</span>
                        <span className="font-bold text-blue-600">£{service.trainingInvestment.toLocaleString()}</span>
                      </div>
                    </div>

                    {service.criticalGaps.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-xs text-gray-600 mb-1">Critical Skill Gaps:</div>
                        <div className="flex flex-wrap gap-1">
                          {service.criticalGaps.map((gap, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {gap}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Skills Heat Map Tab */}
        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Critical Skills Heat Map (REAL DATA)
              </CardTitle>
              <CardDescription>
                Current team average vs required level • Sorted by business priority
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {criticalSkillGaps.map((gap, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-12 rounded ${
                          gap.priority === 'critical' ? 'bg-red-600' :
                          gap.priority === 'high' ? 'bg-amber-600' :
                          'bg-yellow-600'
                        }`} />
                        <div>
                          <h3 className="text-lg font-bold">{gap.skillName}</h3>
                          <div className="text-sm text-gray-600">
                            {gap.peopleNeed} people assessed • Blocks {gap.servicesBlocked.length} services
                          </div>
                        </div>
                      </div>
                      <Badge className={
                        gap.priority === 'critical' ? 'bg-red-600' :
                        gap.priority === 'high' ? 'bg-amber-600' :
                        'bg-yellow-600'
                      }>
                        {gap.priority.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Team Average</div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(i => (
                              <div key={i} className={`w-4 h-4 rounded-sm ${
                                i <= gap.teamAverage ? 'bg-blue-600' : 'bg-gray-200'
                              }`} />
                            ))}
                          </div>
                          <span className="text-sm font-bold">{gap.teamAverage.toFixed(1)}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Required Level</div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(i => (
                              <div key={i} className={`w-4 h-4 rounded-sm ${
                                i <= gap.requiredLevel ? 'bg-green-600' : 'bg-gray-200'
                              }`} />
                            ))}
                          </div>
                          <span className="text-sm font-bold">{gap.requiredLevel.toFixed(1)}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Gap to Close</div>
                        <div className="text-2xl font-black text-red-600">
                          -{gap.gap.toFixed(1)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm pt-3 border-t">
                      <div>
                        <span className="text-gray-600">Services Blocked: </span>
                        <span className="font-bold">{gap.servicesBlocked.join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Training Cost: </span>
                        <span className="font-bold text-blue-600">£{gap.trainingCost.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training Investment Tab */}
        <TabsContent value="investment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Training Investment Plan (AUTO-CALCULATED)
              </CardTitle>
              <CardDescription>
                Based on skill gaps identified in your team's assessments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Skill</TableHead>
                    <TableHead>Gap</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>People</TableHead>
                    <TableHead className="text-right">Investment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {criticalSkillGaps.map((gap, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{gap.skillName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">-{gap.gap.toFixed(1)} levels</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          gap.priority === 'critical' ? 'bg-red-600' :
                          gap.priority === 'high' ? 'bg-amber-600' :
                          'bg-yellow-600'
                        }>
                          {gap.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{gap.peopleNeed}</TableCell>
                      <TableCell className="text-right font-bold text-blue-600">
                        £{gap.trainingCost.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-blue-50 font-bold">
                    <TableCell colSpan={4}>TOTAL INVESTMENT</TableCell>
                    <TableCell className="text-right text-blue-600 text-lg">
                      £{totalInvestmentNeeded.toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <div className="mt-6 border-4 border-green-600 rounded-lg p-6 bg-green-50">
                <div className="text-center space-y-3">
                  <div className="text-sm text-gray-600 font-semibold">PROJECTED ANNUAL REVENUE</div>
                  <div className="text-5xl font-black text-green-600">
                    £{(totalRevenueEnabled * 12 / 1000).toFixed(0)}k
                  </div>
                  <div className="text-sm text-gray-600">from {serviceReadiness.length} services</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Raw Data Tab */}
        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Raw Skills Data ({skillsOverview.length} skills assessed)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Skill</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Team Avg Level</TableHead>
                    <TableHead>Avg Interest</TableHead>
                    <TableHead>People Assessed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {skillsOverview
                    .sort((a, b) => b.avgLevel - a.avgLevel)
                    .slice(0, 20)
                    .map((skill, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{skill.skillName}</TableCell>
                      <TableCell>{skill.category}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{skill.avgLevel.toFixed(1)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{skill.avgInterest.toFixed(1)}</Badge>
                      </TableCell>
                      <TableCell>{skill.teamCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button className="flex-1" size="lg" onClick={() => window.print()}>
          <Download className="w-5 h-5 mr-2" />
          Export Report for Jeremy
        </Button>
        <Button variant="outline" size="lg" onClick={loadRealData}>
          <RefreshCw className="w-5 h-5 mr-2" />
          Refresh Data
        </Button>
      </div>
    </div>
  );
};

export default ServiceReadinessDashboard;
