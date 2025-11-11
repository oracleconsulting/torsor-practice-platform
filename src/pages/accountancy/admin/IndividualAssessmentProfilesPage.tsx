/**
 * INDIVIDUAL ASSESSMENT PROFILES PAGE
 * Accordion/dropdown view showing each team member's strengths, development areas, and role suitability
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  User,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  AlertCircle,
  BookOpen,
  Briefcase,
  Loader2,
  RefreshCw,
  ChevronRight,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import * as individualProfilesApi from '@/lib/api/assessment-insights/individual-profiles-api';
import type { IndividualProfileData } from '@/lib/api/assessment-insights/types';
import { useToast } from '@/components/ui/use-toast';

export default function IndividualAssessmentProfilesPage() {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<IndividualProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState<string | null>(null);
  const [expandedMember, setExpandedMember] = useState<string>('');

  // Fetch all profiles on mount
  useEffect(() => {
    loadAllProfiles();
  }, []);

  const loadAllProfiles = async () => {
    try {
      setLoading(true);

      // Get current user's practice
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: member } = await supabase
        .from('practice_members')
        .select('practice_id')
        .eq('user_id', user.id)
        .single();

      if (!member || !member.practice_id) {
        throw new Error('Practice not found');
      }

      // Fetch all profiles for practice
      console.log('[IndividualProfiles] Fetching profiles for practice:', member.practice_id);
      const allProfiles = await individualProfilesApi.getAllProfilesForPractice(member.practice_id);
      
      console.log('[IndividualProfiles] Loaded profiles:', allProfiles.length);
      
      // If no profiles found, they should have been auto-calculated
      // Log this for debugging
      if (allProfiles.length === 0) {
        console.warn('[IndividualProfiles] ⚠️ No profiles returned - this suggests calculation failed silently');
        console.warn('[IndividualProfiles] Check browser console for errors during profile calculation');
      }
      
      setProfiles(allProfiles);

    } catch (error) {
      console.error('[IndividualProfiles] Error loading profiles:', error);
      toast({
        title: 'Error Loading Profiles',
        description: 'Unable to load individual profiles. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const recalculateProfile = async (memberId: string, memberName: string) => {
    try {
      setRecalculating(memberId);

      const updatedProfile = await individualProfilesApi.calculateIndividualProfile(memberId, true);
      
      if (updatedProfile) {
        // Update in state
        setProfiles(prev => prev.map(p => p.member.id === memberId ? updatedProfile : p));
        
        toast({
          title: 'Profile Recalculated',
          description: `${memberName}'s profile has been updated with latest assessment data.`
        });
      }

    } catch (error) {
      console.error('[IndividualProfiles] Error recalculating:', error);
      toast({
        title: 'Recalculation Failed',
        description: 'Unable to recalculate profile. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setRecalculating(null);
    }
  };

  // Get category badge color
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      technical: 'bg-blue-100 text-blue-800 border-blue-200',
      interpersonal: 'bg-purple-100 text-purple-800 border-purple-200',
      leadership: 'bg-green-100 text-green-800 border-green-200',
      analytical: 'bg-orange-100 text-orange-800 border-orange-200',
      creative: 'bg-pink-100 text-pink-800 border-pink-200'
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getCareerTrajectoryLabel = (trajectory: string) => {
    const labels: Record<string, string> = {
      technical_specialist: 'Technical Specialist',
      people_manager: 'People Manager',
      hybrid_leader: 'Hybrid Leader',
      partner_track: 'Partner Track'
    };
    return labels[trajectory] || trajectory;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">Loading Individual Profiles</p>
          <p className="text-sm text-gray-600">Analyzing assessment data for each team member...</p>
        </div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Profiles Available</CardTitle>
          <CardDescription>
            Individual profiles will appear here once team members complete their assessments.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <User className="w-6 h-6 text-blue-600" />
                Individual Assessment Profiles
              </CardTitle>
              <CardDescription>
                Detailed strengths, development areas, and role suitability for each team member
              </CardDescription>
            </div>
            <Button
              onClick={loadAllProfiles}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-3xl font-bold text-blue-600">{profiles.length}</div>
              <div className="text-sm text-gray-600 mt-1">Team Members</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-3xl font-bold text-green-600">
                {profiles.filter(p => p.stats.role_match_percentage >= 80).length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Excellent Role Fit</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-3xl font-bold text-orange-600">
                {profiles.reduce((sum, p) => sum + p.stats.critical_gaps_count, 0)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Critical Gaps</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-3xl font-bold text-purple-600">
                {Math.round(profiles.reduce((sum, p) => sum + p.stats.overall_readiness, 0) / profiles.length)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Avg Readiness</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Profiles Accordion */}
      <Card>
        <CardHeader>
          <CardTitle>Team Member Profiles</CardTitle>
          <CardDescription>
            Click on a team member to view their detailed assessment profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible value={expandedMember} onValueChange={setExpandedMember}>
            {profiles.map((profileData) => {
              const { member, profile, currentRoleAssignment, stats } = profileData;
              
              return (
                <AccordionItem key={member.id} value={member.id} className="border rounded-lg mb-4 px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-4">
                        {/* Member Info */}
                        <div className="text-left">
                          <h3 className="font-semibold text-lg">{member.name}</h3>
                          <p className="text-sm text-gray-600">{member.role || 'Team Member'}</p>
                        </div>

                        {/* Quick Stats */}
                        <div className="flex gap-3 ml-4">
                          <div className="flex items-center gap-1 text-sm">
                            <Target className="w-4 h-4 text-blue-600" />
                            <span className="font-medium">{stats.role_match_percentage}%</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Award className="w-4 h-4 text-green-600" />
                            <span className="font-medium">{stats.strengths_count}</span>
                          </div>
                          {stats.critical_gaps_count > 0 && (
                            <div className="flex items-center gap-1 text-sm">
                              <AlertCircle className="w-4 h-4 text-red-600" />
                              <span className="font-medium text-red-600">{stats.critical_gaps_count}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Overall Readiness Badge */}
                      <Badge
                        className={
                          stats.overall_readiness >= 80
                            ? 'bg-green-600'
                            : stats.overall_readiness >= 65
                            ? 'bg-blue-600'
                            : stats.overall_readiness >= 50
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                        }
                      >
                        Readiness: {stats.overall_readiness}%
                      </Badge>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent>
                    <div className="space-y-6 pt-4">
                      {/* Header Actions */}
                      <div className="flex justify-between items-center pb-4 border-b">
                        <div className="text-sm text-gray-600">
                          Last calculated: {new Date(profile.last_calculated).toLocaleDateString()}
                        </div>
                        <Button
                          onClick={() => recalculateProfile(member.id, member.name)}
                          disabled={recalculating === member.id}
                          variant="outline"
                          size="sm"
                        >
                          {recalculating === member.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Recalculating...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Recalculate
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Role Suitability Scores */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <Target className="w-5 h-5 text-blue-600" />
                          Role Suitability Scores
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">Advisory</span>
                              <span className="text-sm font-bold">{profile.advisory_score}</span>
                            </div>
                            <Progress value={profile.advisory_score} className="h-2" />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">Technical</span>
                              <span className="text-sm font-bold">{profile.technical_score}</span>
                            </div>
                            <Progress value={profile.technical_score} className="h-2" />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">Hybrid</span>
                              <span className="text-sm font-bold">{profile.hybrid_score}</span>
                            </div>
                            <Progress value={profile.hybrid_score} className="h-2" />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">Leadership</span>
                              <span className="text-sm font-bold">{profile.leadership_score}</span>
                            </div>
                            <Progress value={profile.leadership_score} className="h-2" />
                          </div>
                        </div>

                        {/* Career Trajectory */}
                        <div className="mt-4 pt-4 border-t border-blue-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Career Trajectory:</span>
                            <Badge className="bg-blue-600">
                              {getCareerTrajectoryLabel(profile.career_trajectory)}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm font-medium">Next Role Readiness:</span>
                            <span className="text-sm font-bold">{profile.next_role_readiness}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Strengths */}
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <Award className="w-5 h-5 text-green-600" />
                          Top Strengths ({profile.top_strengths.length})
                        </h4>
                        <div className="space-y-3">
                          {profile.top_strengths.map((strength, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-lg border border-green-200">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h5 className="font-medium text-green-900">{strength.area}</h5>
                                  <p className="text-sm text-gray-600 mt-1">{strength.evidence}</p>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  <Badge className={getCategoryColor(strength.category)}>
                                    {strength.category}
                                  </Badge>
                                  <span className="text-lg font-bold text-green-600">{strength.score}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Development Areas */}
                      <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
                        <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-orange-600" />
                          Development Areas ({profile.development_areas.length})
                        </h4>
                        <div className="space-y-3">
                          {profile.development_areas.map((area, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-lg border border-orange-200">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h5 className="font-medium text-orange-900">{area.area}</h5>
                                    <Badge className={getPriorityColor(area.priority)}>
                                      {area.priority}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                    <span>Current: {area.current_score}</span>
                                    <ChevronRight className="w-4 h-4" />
                                    <span>Target: {area.target_score}</span>
                                    <span className="ml-auto text-xs">⏱ {area.timeline}</span>
                                  </div>
                                  <div className="mb-2">
                                    <Progress
                                      value={(area.current_score / area.target_score) * 100}
                                      className="h-2"
                                    />
                                  </div>
                                  <div className="mt-2">
                                    <p className="text-xs font-medium text-gray-700 mb-1">Recommended Actions:</p>
                                    <ul className="text-xs text-gray-600 space-y-1">
                                      {area.recommended_actions.map((action, actionIdx) => (
                                        <li key={actionIdx}>• {action}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Training Priorities */}
                      {profile.training_priorities.length > 0 && (
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                          <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-purple-600" />
                            Training Priorities ({profile.training_priorities.length})
                          </h4>
                          <div className="space-y-3">
                            {profile.training_priorities.map((priority, idx) => (
                              <div key={idx} className="bg-white p-3 rounded-lg border border-purple-200">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h5 className="font-medium text-purple-900">{priority.skill}</h5>
                                      <Badge className={getPriorityColor(priority.urgency)}>
                                        {priority.urgency}
                                      </Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                                      <div>
                                        <span className="text-gray-600">Duration:</span>
                                        <span className="ml-2 font-medium">{priority.estimated_time}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Method:</span>
                                        <span className="ml-2 font-medium text-xs">{priority.recommended_method}</span>
                                      </div>
                                    </div>
                                    <div className="mt-2 text-xs text-gray-600">
                                      <span className="font-medium">Expected outcome:</span> {priority.expected_outcome}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Personality Summary */}
                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-lg mb-3">Personality & Work Style Summary</h4>
                        <p className="text-sm text-gray-700 mb-4">{profile.personality_summary}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <h5 className="font-medium text-sm mb-2">Optimal Work Conditions</h5>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>Communication: <span className="font-medium">{profile.optimal_work_conditions.communication}</span></div>
                              <div>Environment: <span className="font-medium">{profile.optimal_work_conditions.environment}</span></div>
                              <div>Autonomy: <span className="font-medium">{profile.optimal_work_conditions.autonomy}</span></div>
                              <div>Supervision: <span className="font-medium">{profile.optimal_work_conditions.supervision}</span></div>
                            </div>
                          </div>
                          <div>
                            <h5 className="font-medium text-sm mb-2">Team Contribution Style</h5>
                            <p className="text-xs text-gray-600">{profile.team_contribution_style}</p>
                          </div>
                        </div>
                      </div>

                      {/* Assessment Summaries */}
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200">
                        <h4 className="font-semibold text-lg mb-4">Assessment Results Summary</h4>
                        <div className="grid grid-cols-2 gap-4">
                          
                          {/* EQ Assessment */}
                          {assessments.eq && (
                            <div className="bg-white p-3 rounded-lg border border-indigo-200">
                              <h5 className="font-medium text-sm mb-2 text-indigo-900">Emotional Intelligence (EQ)</h5>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span>Self-Awareness:</span>
                                  <span className="font-medium">{assessments.eq.self_awareness || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Self-Management:</span>
                                  <span className="font-medium">{assessments.eq.self_management || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Social Awareness:</span>
                                  <span className="font-medium">{assessments.eq.social_awareness || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Relationship Mgmt:</span>
                                  <span className="font-medium">{assessments.eq.relationship_management || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Belbin Assessment */}
                          {assessments.belbin && (
                            <div className="bg-white p-3 rounded-lg border border-indigo-200">
                              <h5 className="font-medium text-sm mb-2 text-indigo-900">Belbin Team Roles</h5>
                              <div className="space-y-1 text-xs">
                                <div>
                                  <span className="text-gray-600">Primary Role:</span>
                                  <div className="font-medium text-indigo-700 mt-1">{assessments.belbin.primary_role || 'N/A'}</div>
                                </div>
                                <div className="mt-2">
                                  <span className="text-gray-600">Secondary Role:</span>
                                  <div className="font-medium text-indigo-700 mt-1">{assessments.belbin.secondary_role || 'N/A'}</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Motivational Drivers */}
                          {assessments.motivational_drivers && (
                            <div className="bg-white p-3 rounded-lg border border-indigo-200">
                              <h5 className="font-medium text-sm mb-2 text-indigo-900">Motivational Drivers</h5>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span>Achievement:</span>
                                  <span className="font-medium">{assessments.motivational_drivers.achievement_score || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Affiliation:</span>
                                  <span className="font-medium">{assessments.motivational_drivers.affiliation_score || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Autonomy:</span>
                                  <span className="font-medium">{assessments.motivational_drivers.autonomy_score || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Influence:</span>
                                  <span className="font-medium">{assessments.motivational_drivers.influence_score || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Conflict Style */}
                          {assessments.conflict_style && (
                            <div className="bg-white p-3 rounded-lg border border-indigo-200">
                              <h5 className="font-medium text-sm mb-2 text-indigo-900">Conflict Management Style</h5>
                              <div className="text-xs">
                                <div>
                                  <span className="text-gray-600">Primary Style:</span>
                                  <div className="font-medium text-indigo-700 mt-1 capitalize">
                                    {assessments.conflict_style.primary_style || 'N/A'}
                                  </div>
                                </div>
                                {assessments.conflict_style.secondary_style && (
                                  <div className="mt-2">
                                    <span className="text-gray-600">Secondary Style:</span>
                                    <div className="font-medium text-indigo-700 mt-1 capitalize">
                                      {assessments.conflict_style.secondary_style}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Working Preferences */}
                          {assessments.working_preferences && (
                            <div className="bg-white p-3 rounded-lg border border-indigo-200">
                              <h5 className="font-medium text-sm mb-2 text-indigo-900">Working Preferences</h5>
                              <div className="space-y-1 text-xs">
                                <div>
                                  <span className="text-gray-600">Communication Style:</span>
                                  <div className="font-medium text-indigo-700 mt-1 capitalize">
                                    {assessments.working_preferences.communication_style || 'N/A'}
                                  </div>
                                </div>
                                <div className="mt-2">
                                  <span className="text-gray-600">Work Environment:</span>
                                  <div className="font-medium text-indigo-700 mt-1 capitalize">
                                    {assessments.working_preferences.work_environment || 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* VARK Learning Style */}
                          {assessments.vark && (
                            <div className="bg-white p-3 rounded-lg border border-indigo-200">
                              <h5 className="font-medium text-sm mb-2 text-indigo-900">VARK Learning Style</h5>
                              <div className="text-xs">
                                <div>
                                  <span className="text-gray-600">Primary Style:</span>
                                  <div className="font-medium text-indigo-700 mt-1 capitalize">
                                    {assessments.vark.learning_style || 'N/A'}
                                  </div>
                                </div>
                                {assessments.vark.scores && (
                                  <div className="mt-2 space-y-1">
                                    <div className="flex justify-between">
                                      <span>Visual:</span>
                                      <span className="font-medium">{assessments.vark.scores.visual || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Auditory:</span>
                                      <span className="font-medium">{assessments.vark.scores.auditory || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Reading/Writing:</span>
                                      <span className="font-medium">{assessments.vark.scores.reading || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Kinesthetic:</span>
                                      <span className="font-medium">{assessments.vark.scores.kinesthetic || 0}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Skills Assessment Summary */}
                          {assessments.skills && assessments.skills.length > 0 && (
                            <div className="bg-white p-3 rounded-lg border border-indigo-200 col-span-2">
                              <h5 className="font-medium text-sm mb-2 text-indigo-900">
                                Skills Assessment ({assessments.skills.length} skills evaluated)
                              </h5>
                              <div className="text-xs text-gray-600">
                                <div className="flex items-center gap-2">
                                  <span>Average Skill Level:</span>
                                  <span className="font-medium text-indigo-700">
                                    {(assessments.skills.reduce((sum: number, s: any) => sum + (s.self_rating || 0), 0) / assessments.skills.length).toFixed(1)} / 5.0
                                  </span>
                                </div>
                                <div className="mt-2">
                                  <span>Top Skills:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {assessments.skills
                                      .sort((a: any, b: any) => (b.self_rating || 0) - (a.self_rating || 0))
                                      .slice(0, 10)
                                      .map((skill: any, idx: number) => (
                                        <Badge key={idx} variant="outline" className="text-xs">
                                          {skill.skills?.name || 'Unknown'}: {skill.self_rating}/5
                                        </Badge>
                                      ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Recommended Roles */}
                      {profile.recommended_roles.length > 0 && (
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-blue-600" />
                            Recommended Roles
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {profile.recommended_roles.map((role, idx) => (
                              <Badge key={idx} className="bg-blue-600 px-3 py-1">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Current Role Gaps (if assigned) */}
                      {currentRoleAssignment && profile.current_role_gaps.length > 0 && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="font-semibold mb-2">
                              Gaps vs Current Role: {currentRoleAssignment.role_definition?.role_title}
                            </div>
                            <ul className="text-sm space-y-1">
                              {profile.current_role_gaps.slice(0, 3).map((gap, idx) => (
                                <li key={idx}>
                                  • {gap.competency}: {gap.current}/{gap.required} (Gap: {gap.gap}) - {gap.action}
                                </li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

