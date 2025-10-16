import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { supabase } from '@/lib/supabase/client';
import {
  advisoryServicesMap,
  getTeamCapabilityMatrix,
  canDeliverService,
  getAllRequiredSkills,
  type ServiceLine
} from '@/lib/advisory-services-skills-mapping';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Users,
  TrendingUp,
  Target,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface TeamMemberWithSkills {
  id: string;
  full_name: string;
  email: string;
  role: string;
  skills: { skillName: string; level: number; interest: number }[];
}

export default function AdvisoryCapabilityMatrix() {
  const navigate = useNavigate();
  const { practice, practiceMember } = useAccountancyContext();
  
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithSkills[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<ServiceLine | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  useEffect(() => {
    if (practice?.id) {
      loadTeamData();
    } else {
      // If no practice, still stop loading to show empty state
      setLoading(false);
    }
  }, [practice?.id]);

  const loadTeamData = async () => {
    try {
      // Load all team members
      const { data: members, error: membersError } = await supabase
        .from('practice_members')
        .select('id, full_name, email, role')
        .eq('practice_id', practice?.id);

      if (membersError) throw membersError;

      // Load skills for each member
      const membersWithSkills: TeamMemberWithSkills[] = await Promise.all(
        (members || []).map(async (member) => {
          const { data: assessments } = await supabase
            .from('skill_assessments')
            .select(`
              current_level,
              interest_level,
              skills!inner(name, category)
            `)
            .eq('team_member_id', member.id);

          const skills = (assessments || []).map(a => ({
            skillName: (a as any).skills.name,
            level: a.current_level || 0,
            interest: a.interest_level || 0
          }));

          return {
            ...member,
            skills
          };
        })
      );

      setTeamMembers(membersWithSkills);
    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const capabilityMatrix = getTeamCapabilityMatrix(teamMembers);

  const getReadinessColor = (readiness: string) => {
    switch (readiness) {
      case 'ready': return 'bg-green-500';
      case 'partial': return 'bg-amber-500';
      case 'not-ready': return 'bg-red-500';
      case 'coming-soon': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getReadinessIcon = (readiness: string) => {
    switch (readiness) {
      case 'ready': return <CheckCircle2 className="h-6 w-6 text-green-600" />;
      case 'partial': return <AlertTriangle className="h-6 w-6 text-amber-600" />;
      case 'not-ready': return <XCircle className="h-6 w-6 text-red-600" />;
      case 'coming-soon': return <Clock className="h-6 w-6 text-purple-600" />;
      default: return null;
    }
  };

  const getReadinessLabel = (readiness: string) => {
    switch (readiness) {
      case 'ready': return 'Ready to Deliver';
      case 'partial': return 'Partial Capability';
      case 'not-ready': return 'Not Ready';
      case 'coming-soon': return 'Coming Soon';
      default: return 'Unknown';
    }
  };

  const handleServiceClick = (service: ServiceLine) => {
    setSelectedService(service);
    setShowDetailDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading capability matrix...</p>
        </div>
      </div>
    );
  }

  const readyCount = capabilityMatrix.filter(s => s.readiness === 'ready').length;
  const partialCount = capabilityMatrix.filter(s => s.readiness === 'partial').length;
  const notReadyCount = capabilityMatrix.filter(s => s.readiness === 'not-ready').length;
  const comingSoonCount = capabilityMatrix.filter(s => s.readiness === 'coming-soon').length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/team')}
          className="mb-4"
        >
          ← Back to Team Management
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Advisory Services Capability Matrix
            </h1>
            <p className="text-gray-600">
              Map your team's skills to service delivery capabilities
            </p>
          </div>
          <Target className="h-12 w-12 text-amber-600" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ready to Deliver</p>
                <p className="text-3xl font-bold text-green-600">{readyCount}</p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Partial Capability</p>
                <p className="text-3xl font-bold text-amber-600">{partialCount}</p>
              </div>
              <AlertTriangle className="h-10 w-10 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Not Ready</p>
                <p className="text-3xl font-bold text-red-600">{notReadyCount}</p>
              </div>
              <XCircle className="h-10 w-10 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Coming Soon</p>
                <p className="text-3xl font-bold text-purple-600">{comingSoonCount}</p>
              </div>
              <Clock className="h-10 w-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Cards */}
      <div className="max-w-7xl mx-auto space-y-4">
        {capabilityMatrix.map((item) => {
          const service = item.serviceLine;
          const readiness = item.readiness;

          return (
            <Card
              key={service.id}
              className={`cursor-pointer hover:shadow-lg transition-shadow ${
                readiness === 'coming-soon' ? 'bg-purple-50 border-purple-300' : ''
              }`}
              onClick={() => handleServiceClick(service)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Left: Service Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getReadinessIcon(readiness)}
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                          {service.name}
                          {service.comingSoon && (
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                              <Clock className="h-3 w-3 mr-1" />
                              Coming Soon
                            </Badge>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600">{service.description}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {service.priceRange}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {service.deliveryTime}
                        </Badge>
                      </div>
                    </div>

                    {!service.comingSoon && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Team Capability
                          </span>
                          <span className="text-sm text-gray-600">
                            {item.capableMembers.length} fully capable | {item.partialCapableMembers.length} partial
                          </span>
                        </div>
                        <Progress
                          value={(item.capableMembers.length / Math.max(teamMembers.length, 1)) * 100}
                          className="h-2"
                        />
                        {item.capableMembers.length > 0 && (
                          <p className="text-xs text-gray-600 mt-2">
                            <Users className="h-3 w-3 inline mr-1" />
                            {item.capableMembers.join(', ')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: Status Badge */}
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={`${getReadinessColor(readiness)} text-white px-3 py-1`}>
                      {getReadinessLabel(readiness)}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      View Details
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedService && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  {selectedService.name}
                  {selectedService.comingSoon && (
                    <Badge className="bg-purple-500 text-white">
                      <Clock className="h-3 w-3 mr-1" />
                      Coming Soon
                    </Badge>
                  )}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Service Details */}
                <div>
                  <h3 className="font-bold text-lg mb-2 text-gray-900">Service Overview</h3>
                  <p className="text-gray-700 mb-4">{selectedService.description}</p>
                  <div className="flex gap-4">
                    <Badge variant="outline">{selectedService.priceRange}</Badge>
                    <Badge variant="outline">{selectedService.deliveryTime}</Badge>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h3 className="font-bold text-lg mb-2 text-gray-900">Features</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedService.features.map((feature, idx) => (
                      <li key={idx} className="text-sm text-gray-700">{feature}</li>
                    ))}
                  </ul>
                </div>

                {/* Benefits */}
                <div>
                  <h3 className="font-bold text-lg mb-2 text-gray-900">Client Benefits</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedService.benefits.map((benefit, idx) => (
                      <li key={idx} className="text-sm text-gray-700">{benefit}</li>
                    ))}
                  </ul>
                </div>

                {/* Required Skills */}
                <div>
                  <h3 className="font-bold text-lg mb-2 text-gray-900">Required Skills (from 111 Assessment)</h3>
                  <div className="space-y-2">
                    {selectedService.requiredSkills.map((skill, idx) => {
                      // Check how many team members have this skill
                      const membersWithSkill = teamMembers.filter(m =>
                        m.skills.some(s => s.skillName === skill.skillName && s.level >= skill.minimumLevel)
                      );

                      return (
                        <div key={idx} className="bg-gray-50 p-3 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{skill.skillName}</span>
                              {skill.criticalToDelivery && (
                                <Badge variant="destructive" className="text-xs">Critical</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                Min: Level {skill.minimumLevel}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Ideal: Level {skill.idealLevel}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">
                              Recommended: {skill.recommendedSeniority.join(', ')}
                            </span>
                            <span className="text-xs font-medium text-gray-900">
                              {membersWithSkill.length} team member{membersWithSkill.length !== 1 ? 's' : ''} qualified
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Delivery Team Structure */}
                <div>
                  <h3 className="font-bold text-lg mb-2 text-gray-900">Delivery Team Structure</h3>
                  <div className="space-y-3">
                    {selectedService.deliveryTeam.map((team, idx) => (
                      <div key={idx} className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className="bg-amber-600 text-white">{team.seniority}</Badge>
                          <span className="text-sm text-gray-700">{team.hoursEstimate}</span>
                        </div>
                        <ul className="list-disc list-inside space-y-1 mt-2">
                          {team.responsibilities.map((resp, ridx) => (
                            <li key={ridx} className="text-sm text-gray-700">{resp}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedService.comingSoon && (
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-purple-900 mb-1">Service Under Development</h4>
                        <p className="text-sm text-purple-800">
                          We're currently assessing whether we have the required expertise to deliver this service. 
                          Once we confirm our capability through skills assessments, this service will become available.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

