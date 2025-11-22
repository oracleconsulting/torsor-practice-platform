import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, 
  Target, Users, DollarSign, Calendar, Download, RefreshCw,
  Zap, Award, BookOpen, BarChart3, Activity
} from 'lucide-react';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { supabase } from '@/lib/supabase/client';
import { advisoryServicesMap, canDeliverService, getTeamCapabilityMatrix } from '@/lib/advisory-services-skills-mapping';
import { useToast } from '@/components/ui/use-toast';

interface ServiceReadiness {
  serviceId: string;
  serviceName: string;
  interest: number;
  skillsReadiness: number;
  gap: number;
  status: 'ready' | 'partial' | 'not-ready';
  weeksToReady: number;
  capableMembers: string[];
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
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [skillAssessments, setSkillAssessments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadData();
  }, [practice?.id]);

  const loadData = async () => {
    if (!practice?.id) return;

    try {
      setLoading(true);

      // Load team members
      const { data: members, error: membersError } = await supabase
        .from('practice_members')
        .select('*')
        .eq('practice_id', practice.id)
        .eq('is_active', true);

      if (membersError) throw membersError;

      // Load all skill assessments
      const { data: assessments, error: assessmentsError } = await supabase
        .from('v_member_assessment_overview')
        .select('*');

      if (assessmentsError) throw assessmentsError;

      // Load skills from invitations (skills assessments)
      const { data: skillData, error: skillError } = await supabase
        .from('invitations')
        .select(`
          practice_member_id,
          assessments
        `)
        .eq('practice_id', practice.id)
        .eq('type', 'skills');

      if (skillError) throw skillError;

      setTeamMembers(members || []);
      setSkillAssessments(skillData || []);

      console.log('[ServiceReadiness] Loaded:', {
        members: members?.length,
        skills: skillData?.length
      });

    } catch (error: any) {
      console.error('[ServiceReadiness] Load error:', error);
      toast({
        title: 'Error Loading Data',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate service readiness
  const serviceReadiness = useMemo((): ServiceReadiness[] => {
    if (!teamMembers.length || !skillAssessments.length) return [];

    // Mock interests from your document
    const serviceInterests: Record<string, number> = {
      'management-accounts': 95,
      '365-alignment': 100,
      'profit-extraction': 90,
      'advisory-accelerator': 85,
      'automation': 80,
      'benchmarking': 70,
      'systems-audit': 60
    };

    return advisoryServicesMap.map(service => {
      // Calculate team capability
      const teamSkills = skillAssessments.map(sa => ({
        skillName: '', // TODO: Map actual skill names
        level: 0
      }));

      const capability = getTeamCapabilityMatrix([{
        id: 'team',
        name: 'Team',
        role: 'Team',
        skills: teamSkills
      }]);

      const serviceCapability = capability.find(c => c.serviceLine.id === service.id);
      const interest = serviceInterests[service.id] || 50;
      
      // Simplified readiness calculation
      const skillsReadiness = serviceCapability?.capableMembers.length 
        ? 100 
        : serviceCapability?.partialCapableMembers.length 
        ? 60 
        : 30;

      const gap = interest - skillsReadiness;
      
      let status: 'ready' | 'partial' | 'not-ready' = 'not-ready';
      let weeksToReady = 12;
      
      if (skillsReadiness >= 80) {
        status = 'ready';
        weeksToReady = 0;
      } else if (skillsReadiness >= 60) {
        status = 'partial';
        weeksToReady = 4;
      } else {
        weeksToReady = 8;
      }

      return {
        serviceId: service.id,
        serviceName: service.name,
        interest,
        skillsReadiness,
        gap,
        status,
        weeksToReady,
        capableMembers: serviceCapability?.capableMembers || [],
        criticalGaps: service.requiredSkills
          .filter(s => s.criticalToDelivery)
          .map(s => s.skillName)
          .slice(0, 3),
        trainingInvestment: Math.round(gap * 250), // £250 per % gap
        revenueEnabled: service.id === 'management-accounts' ? 40000 
          : service.id === '365-alignment' ? 18000
          : service.id === 'profit-extraction' ? 16000
          : service.id === 'advisory-accelerator' ? 15000
          : 10000
      };
    });
  }, [teamMembers, skillAssessments]);

  // Calculate critical skill gaps
  const criticalSkillGaps = useMemo((): SkillGap[] => {
    return [
      {
        skillName: 'Board Presentation',
        teamAverage: 3,
        requiredLevel: 5,
        gap: 2,
        priority: 'critical',
        servicesBlocked: ['Profit Extraction', 'CFO', 'Advisory'],
        peopleNeed: 4,
        trainingCost: 3000
      },
      {
        skillName: 'Strategic Options Appraisal',
        teamAverage: 2.5,
        requiredLevel: 5,
        gap: 2.5,
        priority: 'critical',
        servicesBlocked: ['CFO', 'Advisory', '365'],
        peopleNeed: 6,
        trainingCost: 4000
      },
      {
        skillName: 'Business Valuations',
        teamAverage: 2.5,
        requiredLevel: 4,
        gap: 1.5,
        priority: 'critical',
        servicesBlocked: ['Profit Extraction', 'Advisory'],
        peopleNeed: 2,
        trainingCost: 3000
      },
      {
        skillName: 'Financial Statements Prep',
        teamAverage: 3.5,
        requiredLevel: 5,
        gap: 1.5,
        priority: 'high',
        servicesBlocked: ['Management Accounts'],
        peopleNeed: 1,
        trainingCost: 500
      },
      {
        skillName: 'Three-way Forecasting',
        teamAverage: 3.5,
        requiredLevel: 5,
        gap: 1.5,
        priority: 'high',
        servicesBlocked: ['CFO', 'Advisory'],
        peopleNeed: 3,
        trainingCost: 2000
      }
    ];
  }, []);

  const totalInvestmentNeeded = useMemo(() => {
    return criticalSkillGaps.reduce((sum, gap) => sum + gap.trainingCost, 0);
  }, [criticalSkillGaps]);

  const totalRevenueEnabled = useMemo(() => {
    return serviceReadiness.reduce((sum, service) => sum + service.revenueEnabled, 0);
  }, [serviceReadiness]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-12 h-12 animate-spin text-blue-600" />
      </div>
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
                Strategic skills gap analysis • Training investment ROI • Launch timeline
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
                  {Math.round((totalRevenueEnabled / totalInvestmentNeeded) * 10) / 10}x
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
          <TabsTrigger value="timeline">Launch Timeline</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Service Launch Readiness Matrix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {serviceReadiness.map(service => (
                  <div key={service.serviceId} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold">{service.serviceName}</h3>
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
                Critical Skills Heat Map
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
                            {gap.peopleNeed} people need training • Blocks {gap.servicesBlocked.length} services
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
                Training Investment & ROI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Phase breakdown */}
                <div className="space-y-3">
                  <div className="border rounded-lg p-4 bg-red-50">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-red-900">Immediate Phase (Weeks 1-2)</h3>
                      <div className="text-2xl font-black text-red-600">£3,500</div>
                    </div>
                    <div className="text-sm space-y-1">
                      <div>• Board Presentation Bootcamp (£3,000)</div>
                      <div>• Financial Statements Verification (£500)</div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-red-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-red-800 font-semibold">Revenue Enabled:</span>
                        <span className="font-bold text-green-600">£3,000 MRR</span>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-amber-50">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-amber-900">Short-term Phase (Weeks 3-4)</h3>
                      <div className="text-2xl font-black text-amber-600">£5,500</div>
                    </div>
                    <div className="text-sm space-y-1">
                      <div>• Strategic Options Workshop (£4,000)</div>
                      <div>• Executive Writing Skills (£1,500)</div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-amber-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-amber-800 font-semibold">Revenue Enabled:</span>
                        <span className="font-bold text-green-600">£9,500 MRR</span>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-green-50">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-green-900">Medium-term Phase (Month 2-3)</h3>
                      <div className="text-2xl font-black text-green-600">£7,500</div>
                    </div>
                    <div className="text-sm space-y-1">
                      <div>• Business Valuations Certification (£3,000)</div>
                      <div>• Power BI Training (£1,500)</div>
                      <div>• MEdirisinghe Fast-track (£3,000 upfront)</div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-800 font-semibold">Revenue Enabled:</span>
                        <span className="font-bold text-green-600">£22,500 MRR</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ROI Summary */}
                <Card className="border-4 border-blue-600 bg-blue-50">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-3">
                      <div>
                        <div className="text-sm text-gray-600 font-semibold">TOTAL INVESTMENT</div>
                        <div className="text-5xl font-black text-blue-600">£16,500</div>
                      </div>
                      <div className="text-4xl font-black text-gray-400">↓</div>
                      <div>
                        <div className="text-sm text-gray-600 font-semibold">6-MONTH MRR ENABLED</div>
                        <div className="text-5xl font-black text-green-600">£89,000</div>
                      </div>
                      <div className="text-4xl font-black text-gray-400">↓</div>
                      <div>
                        <div className="text-sm text-gray-600 font-semibold">ANNUAL REVENUE IMPACT</div>
                        <div className="text-5xl font-black text-purple-600">£1.07M</div>
                      </div>
                      <div className="pt-4 border-t-4 border-blue-300">
                        <div className="text-sm text-gray-600 font-semibold">ROI</div>
                        <div className="text-6xl font-black text-orange-600">65x</div>
                        <div className="text-sm text-gray-600 mt-1">(Annual)</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Service Launch Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Week 1 */}
                <div className="border-l-4 border-green-600 pl-4">
                  <div className="font-black text-lg mb-2">✓ Week 1 - LAUNCH NOW</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="font-bold">Management Accounts</span>
                      <Badge className="bg-green-600">READY</Badge>
                    </div>
                  </div>
                </div>

                {/* Week 3 */}
                <div className="border-l-4 border-amber-600 pl-4">
                  <div className="font-black text-lg mb-2">Week 3 - AFTER TRAINING</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span className="font-bold">Profit Extraction</span>
                      <Badge className="bg-amber-600">TRAINING NEEDED</Badge>
                    </div>
                  </div>
                </div>

                {/* Week 4 */}
                <div className="border-l-4 border-amber-600 pl-4">
                  <div className="font-black text-lg mb-2">Week 4 - AFTER TRAINING</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span className="font-bold">Fractional CFO</span>
                      <Badge className="bg-amber-600">JEREMY READY, TEAM NEEDS DEV</Badge>
                    </div>
                  </div>
                </div>

                {/* Week 6 */}
                <div className="border-l-4 border-orange-600 pl-4">
                  <div className="font-black text-lg mb-2">Week 6 - SIGNIFICANT TRAINING</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      <span className="font-bold">365 Alignment</span>
                      <Badge className="bg-orange-600">6 WEEKS NEEDED</Badge>
                    </div>
                  </div>
                </div>

                {/* Month 3 */}
                <div className="border-l-4 border-red-600 pl-4">
                  <div className="font-black text-lg mb-2">Month 3 - MAJOR DEVELOPMENT</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="font-bold">Advisory Accelerator</span>
                      <Badge className="bg-red-600">12 WEEKS NEEDED</Badge>
                    </div>
                  </div>
                </div>
              </div>
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
        <Button variant="outline" size="lg" onClick={loadData}>
          <RefreshCw className="w-5 h-5 mr-2" />
          Refresh Data
        </Button>
      </div>
    </div>
  );
};

export default ServiceReadinessDashboard;

