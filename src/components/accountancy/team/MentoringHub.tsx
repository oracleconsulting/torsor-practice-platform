/**
 * MentoringHub Component
 * PROMPT 4 Implementation
 * 
 * Automated mentor-mentee matching system with:
 * - Matching algorithm with VARK compatibility
 * - Mentor profile cards
 * - Session scheduling and tracking
 * - Progress dashboard
 * - Goal management
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  UserPlus,
  Calendar,
  Target,
  TrendingUp,
  Award,
  CheckCircle,
  Sparkles,
  Send,
  Lightbulb,
  ArrowRight
} from 'lucide-react';

import type { TeamMemberForMatching, MentorMatch, MentorProfile } from '@/services/mentoring/matchingAlgorithm';
import { findMentorMatches, identifyMentors, identifyLearners } from '@/services/mentoring/matchingAlgorithm';
import {
  getMentoringRelationships,
  createMentoringRelationship,
  updateRelationshipStatus,
  getSessions,
  getGoals,
  getMentorStatistics,
  type MentoringRelationship,
  type MentoringSession,
  type MentoringGoal
} from '@/lib/api/mentoring';

interface MentoringHubProps {
  teamMembers: TeamMemberForMatching[];
  currentUserId: string;
}

const MentoringHub: React.FC<MentoringHubProps> = ({ teamMembers, currentUserId }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [relationships, setRelationships] = useState<MentoringRelationship[]>([]);
  const [mentorProfiles, setMentorProfiles] = useState<MentorProfile[]>([]);
  const [recommendedMatches, setRecommendedMatches] = useState<MentorMatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRelationship, setSelectedRelationship] = useState<string | null>(null);
  const [sessions, setSessions] = useState<MentoringSession[]>([]);
  const [goals, setGoals] = useState<MentoringGoal[]>([]);
  const [mentorStats, setMentorStats] = useState<any>(null);
  const [selectedMentorForDetails, setSelectedMentorForDetails] = useState<MentorProfile | null>(null);

  // Dialog states
  const [showRequestDialog, setShowRequestDialog] = useState<boolean>(false);
  const [selectedMatch, setSelectedMatch] = useState<MentorMatch | null>(null);
  const [selectedSkillForMentoring, setSelectedSkillForMentoring] = useState<string>('');

  // Load data
  useEffect(() => {
    loadData();
  }, [currentUserId]);

  useEffect(() => {
    if (selectedRelationship) {
      loadRelationshipDetails(selectedRelationship);
    }
  }, [selectedRelationship]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load existing relationships
      const rels = await getMentoringRelationships(currentUserId);
      setRelationships(rels);

      // Identify mentors and learners
      const mentors = identifyMentors(teamMembers);
      identifyLearners(teamMembers); // Used by matching algorithm
      setMentorProfiles(mentors);

      // Find recommended matches for current user
      const matches = findMentorMatches(teamMembers, currentUserId);
      setRecommendedMatches(matches);

      // Load mentor stats if user is a mentor
      const isMentor = mentors.some(m => m.id === currentUserId);
      if (isMentor) {
        const stats = await getMentorStatistics(currentUserId);
        setMentorStats(stats);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load mentoring data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRelationshipDetails = async (relationshipId: string) => {
    try {
      const [sessionsData, goalsData] = await Promise.all([
        getSessions(relationshipId),
        getGoals(relationshipId)
      ]);
      setSessions(sessionsData);
      setGoals(goalsData);
    } catch (error) {
      console.error('Error loading relationship details:', error);
    }
  };

  const handleRequestMentorship = async (match: MentorMatch) => {
    setSelectedMatch(match);
    // Pre-select first matched skill
    setSelectedSkillForMentoring(match.matchedSkills[0] || '');
    setShowRequestDialog(true);
  };

  const confirmRequestMentorship = async () => {
    if (!selectedMatch || !user?.id) return;

    try {
      const result = await createMentoringRelationship(selectedMatch, user.id);
      
      if (result.success) {
        toast({
          title: 'Mentorship Requested!',
          description: 'Your mentor has been notified and will review your request.',
        });
        setShowRequestDialog(false);
        loadData(); // Refresh data
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create mentorship request',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error requesting mentorship:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    }
  };

  const handleAcceptMatch = async (relationshipId: string) => {
    try {
      const success = await updateRelationshipStatus(relationshipId, 'active', true);
      if (success) {
        toast({
          title: 'Match Accepted!',
          description: 'Your mentoring relationship is now active.',
        });
        loadData();
      }
    } catch (error) {
      console.error('Error accepting match:', error);
    }
  };

  const renderLearningStyleBadge = (style?: string) => {
    if (!style) return null;

    const styleConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
      visual: { icon: '👁️', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', label: 'Visual' },
      auditory: { icon: '👂', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', label: 'Auditory' },
      reading_writing: { icon: '📝', color: 'bg-green-500/20 text-green-300 border-green-500/30', label: 'Read/Write' },
      kinesthetic: { icon: '🤸', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30', label: 'Kinesthetic' },
      multimodal: { icon: '🌈', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', label: 'Multimodal' }
    };

    const config = styleConfig[style];
    if (!config) return null;

    return (
      <Badge variant="outline" className={`${config.color} text-xs`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </Badge>
    );
  };

  // Render mentor profile card
  const renderMentorCard = (mentor: MentorProfile, match?: MentorMatch, showDetailsButton: boolean = false) => {
    const initials = mentor.name.split(' ').map(n => n[0]).join('');
    
    return (
      <Card 
        key={mentor.id} 
        className="bg-white border-gray-200 hover:border-blue-500 transition-colors cursor-pointer"
        onClick={() => showDetailsButton && setSelectedMentorForDetails(mentor)}
      >
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16 ring-2 ring-blue-200">
              <AvatarFallback className="text-lg font-semibold bg-blue-100 text-blue-700">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900">{mentor.name}</h3>
                  {mentor.availableSlots > 0 && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
                      <UserPlus className="w-3 h-3 mr-1" />
                      Available
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">{mentor.role}</p>
              </div>

              {renderLearningStyleBadge(mentor.learningStyle)}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Award className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-600">
                    {mentor.expertiseAreas.length} area{mentor.expertiseAreas.length !== 1 ? 's' : ''} of expertise
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {mentor.expertiseAreas.slice(0, 3).map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                      {skill}
                    </Badge>
                  ))}
                  {mentor.expertiseAreas.length > 3 && (
                    <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                      +{mentor.expertiseAreas.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              {match && (
                <div className="pt-3 border-t border-gray-200 space-y-3">
                  {/* Matched Skills - PROMINENTLY DISPLAYED */}
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-2">
                      Can help you with:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {match.matchedSkills.map((skill, idx) => (
                        <Badge key={idx} variant="default" className="bg-blue-100 text-blue-700 border-blue-300">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Match Score</span>
                    <span className="text-lg font-bold text-blue-600">{match.matchScore}%</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>VARK Compatibility</span>
                      <span>{match.varkCompatibility}%</span>
                    </div>
                    <Progress value={match.varkCompatibility} className="h-1" />
                  </div>
                  <p className="text-sm text-gray-600 italic">{match.rationale}</p>
                  
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRequestMentorship(match);
                    }}
                    className="w-full mt-2"
                    variant="default"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Request Mentorship
                  </Button>
                </div>
              )}

              {showDetailsButton && (
                <Button
                  variant="outline"
                  className="w-full mt-2 border-blue-300 text-blue-600 hover:bg-blue-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMentorForDetails(mentor);
                  }}
                >
                  View All Skills & Request Mentorship
                </Button>
              )}

              {mentor.currentMentees > 0 && !match && !showDetailsButton && (
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Current mentees:</span>
                    <span className="font-medium text-gray-900">{mentor.currentMentees} / {mentor.maxMentees}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render relationship card
  const renderRelationshipCard = (rel: MentoringRelationship) => {
    const isMentor = rel.mentor_id === currentUserId;
    const otherPersonId = isMentor ? rel.mentee_id : rel.mentor_id;
    const otherPerson = teamMembers.find(m => m.id === otherPersonId);
    
    if (!otherPerson) return null;

    const relationshipSessions = sessions.filter(s => s.relationship_id === rel.id);
    const completedSessions = relationshipSessions.filter(s => s.status === 'completed').length;
    const relationshipGoals = goals.filter(g => g.relationship_id === rel.id);
    const achievedGoals = relationshipGoals.filter(g => g.status === 'achieved').length;

    return (
      <Card
        key={rel.id}
        className="bg-white border-gray-200 hover:border-blue-500 transition-colors cursor-pointer"
        onClick={() => setSelectedRelationship(rel.id)}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 ring-2 ring-blue-200">
                <AvatarFallback className="text-sm font-semibold bg-blue-100 text-blue-700">
                  {otherPerson.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-gray-900">{otherPerson.name}</h3>
                <p className="text-sm text-gray-600">
                  {isMentor ? 'Your Mentee' : 'Your Mentor'}
                </p>
              </div>
            </div>

            <Badge
              variant="outline"
              className={
                rel.status === 'active'
                  ? 'bg-green-50 text-green-700 border-green-300'
                  : rel.status === 'pending'
                  ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                  : 'bg-gray-50 text-gray-700 font-medium border-gray-300'
              }
            >
              {rel.status.charAt(0).toUpperCase() + rel.status.slice(1)}
            </Badge>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex flex-wrap gap-1">
              {rel.matched_skills.map((skill, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{completedSessions}</div>
              <div className="text-xs text-gray-600">Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{achievedGoals}</div>
              <div className="text-xs text-gray-600">Goals Achieved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{rel.match_score}%</div>
              <div className="text-xs text-gray-600">Match</div>
            </div>
          </div>

          {rel.status === 'pending' && isMentor && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleAcceptMatch(rel.id);
              }}
              className="w-full mt-4"
              variant="default"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Accept Match
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-8 h-8 text-blue-600" />
            Mentoring Hub
          </h2>
          <p className="text-gray-600 mt-1">
            Connect with mentors and grow your skills
          </p>
        </div>

        {mentorStats && (
          <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Award className="w-10 h-10 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold text-yellow-700">
                    {mentorStats.total_mentees || 0}
                  </div>
                  <div className="text-xs text-gray-600">Mentees Helped</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">
            <Target className="w-4 h-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="find-by-skill">
            <Lightbulb className="w-4 h-4 mr-2" />
            Find by Skill
          </TabsTrigger>
          <TabsTrigger value="find-mentor">
            <Sparkles className="w-4 h-4 mr-2" />
            Browse Mentors
          </TabsTrigger>
          <TabsTrigger value="my-mentoring">
            <Users className="w-4 h-4 mr-2" />
            My Mentoring
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Statistics Overview */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="bg-white border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-gray-900">
                      {relationships.length}
                    </div>
                    <div className="text-xs text-gray-600">Active Relationships</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-500" />
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-gray-900">
                      {sessions.filter(s => s.status === 'completed').length}
                    </div>
                    <div className="text-xs text-gray-600">Sessions Completed</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-500" />
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-gray-900">
                      {goals.filter(g => g.status === 'achieved').length}
                    </div>
                    <div className="text-xs text-gray-600">Goals Achieved</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-gray-900">
                      {mentorProfiles.length}
                    </div>
                    <div className="text-xs text-gray-600">Available Mentors</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommended Matches */}
          {recommendedMatches.length > 0 && (
            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-purple-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                  Recommended Mentors for You
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Based on your skills, interests, and learning style
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {recommendedMatches.slice(0, 3).map((match) => {
                    const mentor = mentorProfiles.find(m => m.id === match.mentorId);
                    if (!mentor) return null;
                    return renderMentorCard(mentor, match);
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Relationships */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900 font-bold">Your Mentoring Relationships</CardTitle>
              <CardDescription className="text-gray-600 font-semibold">
                {relationships.length === 0
                  ? 'No active mentoring relationships yet'
                  : `You have ${relationships.length} active relationship${relationships.length !== 1 ? 's' : ''}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {relationships.map(rel => renderRelationshipCard(rel))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

          {/* Find by Skill Tab - NEW SKILL-FIRST NAVIGATION */}
        <TabsContent value="find-by-skill" className="space-y-6">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">
                <Lightbulb className="w-5 h-5 inline mr-2 text-blue-600" />
                Find Mentor by Skill
              </CardTitle>
              <CardDescription className="text-gray-600">
                Select a skill you want to develop, then choose from mentors who can help
              </CardDescription>
            </CardHeader>
          </Card>

          {(() => {
            // Get current user's skills from teamMembers
            const currentUserData = teamMembers.find(m => m.id === currentUserId);
            if (!currentUserData || !currentUserData.skills || !Array.isArray(currentUserData.skills) || currentUserData.skills.length === 0) {
              return (
                <Card className="bg-white border-gray-200">
                  <CardContent className="p-12 text-center">
                    <Lightbulb className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">Complete Your Skills Assessment</h3>
                    <p className="text-gray-600 mb-6">
                      Take the skills assessment to discover which mentors can help you grow
                    </p>
                  </CardContent>
                </Card>
              );
            }

            // Get skills user wants to develop (interest >= 4 and currentLevel < 4)
            const skillsToGrow = currentUserData.skills
              .filter(skill => 
                skill && 
                typeof skill.interestLevel === 'number' && 
                typeof skill.currentLevel === 'number' &&
                skill.interestLevel >= 4 && 
                skill.currentLevel < 4
              )
              .sort((a, b) => b.interestLevel - a.interestLevel);

            // For each skill, find mentors who can teach it
            const skillMentorMap: Record<string, { mentor: MentorProfile; level: number }[]> = {};
            
            skillsToGrow.forEach(userSkill => {
              const mentorsForSkill = mentorProfiles
                .filter(mentor => {
                  // Get the full team member data to access skills
                  const mentorTeamData = teamMembers.find(m => m.id === mentor.id);
                  if (!mentorTeamData || !mentorTeamData.skills || !Array.isArray(mentorTeamData.skills)) return false;
                  
                  // Find if mentor has this skill at a higher level
                  const mentorSkillLevel = mentorTeamData.skills.find(s => s.skillId === userSkill.skillId)?.currentLevel || 0;
                  return mentorSkillLevel >= 4 && mentorSkillLevel > userSkill.currentLevel;
                })
                .map(mentor => {
                  const mentorTeamData = teamMembers.find(m => m.id === mentor.id);
                  return {
                    mentor,
                    level: mentorTeamData?.skills?.find(s => s.skillId === userSkill.skillId)?.currentLevel || 0
                  };
                })
                .sort((a, b) => b.level - a.level);
              
              if (mentorsForSkill.length > 0) {
                skillMentorMap[userSkill.skillName] = mentorsForSkill;
              }
            });

            if (Object.keys(skillMentorMap).length === 0) {
              return (
                <Card className="bg-white border-gray-200">
                  <CardContent className="p-12 text-center">
                    <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">You're Doing Great!</h3>
                    <p className="text-gray-600 mb-6">
                      You're already skilled in the areas you're interested in. Consider exploring new skills or becoming a mentor yourself!
                    </p>
                  </CardContent>
                </Card>
              );
            }

            return (
              <div className="space-y-4">
                {Object.entries(skillMentorMap).map(([skillName, mentorsData]) => {
                  const userSkill = currentUserData.skills.find(s => s.skillName === skillName);
                  const mentorCount = mentorsData.length;

                  return (
                    <Card key={skillName} className="bg-white border-gray-200 hover:border-blue-500 transition-colors">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg text-gray-900">{skillName}</CardTitle>
                            <CardDescription className="text-gray-600">
                              Your level: {userSkill?.currentLevel}/5 • Interest: {userSkill?.interestLevel}/5
                            </CardDescription>
                          </div>
                          <Badge variant="secondary" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                            {mentorCount} mentor{mentorCount !== 1 ? 's' : ''} available
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-3">
                          {mentorsData.slice(0, 3).map(({ mentor, level }) => {
                            if (!mentor || !mentor.name) return null;
                            
                            const match = recommendedMatches.find(m => m.mentorId === mentor.id);
                            const initials = mentor.name.split(' ').map(n => n[0]).join('');
                            
                            return (
                              <div 
                                key={mentor.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <Avatar className="w-10 h-10">
                                    <AvatarFallback className="text-sm font-semibold bg-blue-100 text-blue-700">
                                      {initials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="font-semibold text-gray-900">{mentor.name}</div>
                                    <div className="text-xs text-gray-600">{mentor.role || 'Team Member'}</div>
                                  </div>
                                  <div className="text-right">
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                      Level {level}/5
                                    </Badge>
                                    {match && (
                                      <div className="text-xs text-blue-600 font-medium mt-1">{match.matchScore}% match</div>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (match) {
                                      setSelectedMatch(match);
                                      setSelectedSkillForMentoring(skillName);
                                      setShowRequestDialog(true);
                                    }
                                  }}
                                  className="ml-3"
                                  disabled={!match}
                                >
                                  <Send className="w-3 h-3 mr-1" />
                                  Request
                                </Button>
                              </div>
                            );
                          }).filter(Boolean)}
                          {mentorCount > 3 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActiveTab('find-mentor')}
                              className="mt-2 border-blue-300 text-blue-600 hover:bg-blue-50"
                            >
                              <ArrowRight className="w-4 h-4 mr-2" />
                              View all {mentorCount} mentors
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            );
          })()}
        </TabsContent>

        {/* Find Mentor Tab */}
        <TabsContent value="find-mentor" className="space-y-6">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Browse Available Mentors</CardTitle>
              <CardDescription className="text-gray-600">
                {mentorProfiles.filter(m => m.availableSlots > 0).length} mentors available to help you grow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {mentorProfiles
                  .filter(m => m.availableSlots > 0 && m.id !== currentUserId)
                  .map(mentor => {
                    const match = recommendedMatches.find(m => m.mentorId === mentor.id);
                    return renderMentorCard(mentor, match, true);
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Mentoring Tab */}
        <TabsContent value="my-mentoring" className="space-y-6">
          {relationships.length === 0 ? (
            <Card className="bg-white border-gray-200">
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-900">No Mentoring Relationships Yet</h3>
                <p className="text-gray-600 mb-6">
                  Get started by finding a mentor who can help you grow
                </p>
                <Button onClick={() => setActiveTab('find-mentor')}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Find a Mentor
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {relationships.map(rel => renderRelationshipCard(rel))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Mentor Details Dialog */}
      <Dialog open={!!selectedMentorForDetails} onOpenChange={(open) => !open && setSelectedMentorForDetails(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {selectedMentorForDetails?.name}'s Skills & Expertise
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              All skills this mentor can help you with
            </DialogDescription>
          </DialogHeader>
          {selectedMentorForDetails && (
            <div className="space-y-6">
              {/* Mentor Profile Summary */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <Avatar className="w-16 h-16 ring-2 ring-blue-200">
                  <AvatarFallback className="text-lg font-semibold bg-blue-100 text-blue-700">
                    {selectedMentorForDetails.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{selectedMentorForDetails.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{selectedMentorForDetails.role}</p>
                  {renderLearningStyleBadge(selectedMentorForDetails.learningStyle)}
                </div>
              </div>

              {/* All Skills */}
              {(() => {
                const mentorTeamData = teamMembers.find(m => m.id === selectedMentorForDetails.id);
                const mentorSkills = mentorTeamData?.skills || [];

                return (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">All Skills ({mentorSkills.length})</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {mentorSkills.map((skill, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                          <span className="text-sm font-medium text-gray-900">{skill.skillName}</span>
                          <Badge variant="outline" className={
                            skill.currentLevel >= 4 
                              ? "bg-green-50 text-green-700 border-green-300" 
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }>
                            Level {skill.currentLevel}/5
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Expertise Areas */}
              {selectedMentorForDetails.expertiseAreas.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Areas of Expertise</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMentorForDetails.expertiseAreas.map((area, idx) => (
                      <Badge key={idx} className="bg-blue-100 text-blue-700">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Match Score if available */}
              {(() => {
                const match = recommendedMatches.find(m => m.mentorId === selectedMentorForDetails.id);
                if (!match) return null;

                return (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Match Analysis</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Overall Match</span>
                        <span className="text-lg font-bold text-blue-600">{match.matchScore}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">VARK Compatibility</span>
                        <span className="text-sm font-medium text-gray-900">{match.varkCompatibility}%</span>
                      </div>
                      <Progress value={match.varkCompatibility} className="h-2" />
                      <p className="text-sm text-gray-600 italic">{match.rationale}</p>
                      
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Skills they can help you with:</div>
                        <div className="flex flex-wrap gap-1">
                          {match.matchedSkills.map((skill, idx) => (
                            <Badge key={idx} className="bg-blue-100 text-blue-700">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedMentorForDetails(null)}>
              Close
            </Button>
            <Button onClick={() => {
              if (selectedMentorForDetails) {
                const match = recommendedMatches.find(m => m.mentorId === selectedMentorForDetails.id);
                if (match) {
                  handleRequestMentorship(match);
                  setSelectedMentorForDetails(null);
                }
              }
            }}>
              <Send className="w-4 h-4 mr-2" />
              Request Mentorship
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Mentorship Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Mentorship</DialogTitle>
            <DialogDescription>
              Send a mentorship request to {selectedMatch?.mentorName}
            </DialogDescription>
          </DialogHeader>
          {selectedMatch && (
            <div className="space-y-4">
              {/* Skill Selector - PRIMARY FOCUS */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">
                  Which skill do you want to focus on? *
                </Label>
                <Select 
                  value={selectedSkillForMentoring} 
                  onValueChange={setSelectedSkillForMentoring}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a skill..." />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedMatch.matchedSkills.map((skill, idx) => (
                      <SelectItem key={idx} value={skill}>
                        {skill}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  You can discuss other skills during your sessions
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Match Score:</span>
                  <span className="text-primary font-bold">{selectedMatch.matchScore}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">All Skills Match:</span>
                  <span>{selectedMatch.matchedSkills.join(', ')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">VARK Compatibility:</span>
                  <span>{selectedMatch.varkCompatibility}%</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedMatch.rationale}
              </p>
              <div className="space-y-2">
                <Label>Suggested Goals:</Label>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {selectedMatch.suggestedGoals.filter(goal => 
                    !selectedSkillForMentoring || goal.toLowerCase().includes(selectedSkillForMentoring.toLowerCase())
                  ).map((goal, idx) => (
                    <li key={idx}>{goal}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmRequestMentorship}
              disabled={!selectedSkillForMentoring}
            >
              <Send className="w-4 h-4 mr-2" />
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MentoringHub;

