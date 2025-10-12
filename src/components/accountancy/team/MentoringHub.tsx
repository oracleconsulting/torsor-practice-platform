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
import {
  Users,
  UserPlus,
  Calendar,
  Target,
  TrendingUp,
  Award,
  CheckCircle,
  Sparkles,
  Send
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

  // Dialog states
  const [showRequestDialog, setShowRequestDialog] = useState<boolean>(false);
  const [selectedMatch, setSelectedMatch] = useState<MentorMatch | null>(null);

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
  const renderMentorCard = (mentor: MentorProfile, match?: MentorMatch) => {
    const initials = mentor.name.split(' ').map(n => n[0]).join('');
    
    return (
      <Card key={mentor.id} className="bg-card/50 border-border hover:border-primary/50 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16 ring-2 ring-primary/20">
              <AvatarFallback className="text-lg font-semibold bg-primary/10">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-card-foreground">{mentor.name}</h3>
                  {mentor.availableSlots > 0 && (
                    <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                      <UserPlus className="w-3 h-3 mr-1" />
                      Available
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{mentor.role}</p>
              </div>

              {renderLearningStyleBadge(mentor.learningStyle)}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Award className="w-4 h-4 text-yellow-400" />
                  <span className="text-muted-foreground">
                    {mentor.expertiseAreas.length} area{mentor.expertiseAreas.length !== 1 ? 's' : ''} of expertise
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {mentor.expertiseAreas.slice(0, 3).map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {mentor.expertiseAreas.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{mentor.expertiseAreas.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              {match && (
                <div className="pt-3 border-t border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Match Score</span>
                    <span className="text-lg font-bold text-primary">{match.matchScore}%</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>VARK Compatibility</span>
                      <span>{match.varkCompatibility}%</span>
                    </div>
                    <Progress value={match.varkCompatibility} className="h-1" />
                  </div>
                  <p className="text-sm text-muted-foreground italic">{match.rationale}</p>
                  
                  <Button
                    onClick={() => handleRequestMentorship(match)}
                    className="w-full mt-2"
                    variant="default"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Request Mentorship
                  </Button>
                </div>
              )}

              {mentor.currentMentees > 0 && !match && (
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Current mentees:</span>
                    <span className="font-medium">{mentor.currentMentees} / {mentor.maxMentees}</span>
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
        className="bg-card/50 border-border hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => setSelectedRelationship(rel.id)}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 ring-2 ring-primary/20">
                <AvatarFallback className="text-sm font-semibold bg-primary/10">
                  {otherPerson.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-card-foreground">{otherPerson.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {isMentor ? 'Your Mentee' : 'Your Mentor'}
                </p>
              </div>
            </div>

            <Badge
              variant="outline"
              className={
                rel.status === 'active'
                  ? 'bg-green-500/20 text-green-300 border-green-500/30'
                  : rel.status === 'pending'
                  ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                  : 'bg-gray-500/20 text-white font-medium border-gray-500/30'
              }
            >
              {rel.status.charAt(0).toUpperCase() + rel.status.slice(1)}
            </Badge>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex flex-wrap gap-1">
              {rel.matched_skills.map((skill, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{completedSessions}</div>
              <div className="text-xs text-muted-foreground">Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{achievedGoals}</div>
              <div className="text-xs text-muted-foreground">Goals Achieved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{rel.match_score}%</div>
              <div className="text-xs text-muted-foreground">Match</div>
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
          <h2 className="text-3xl font-bold text-card-foreground flex items-center gap-2">
            <Users className="w-8 h-8 text-primary" />
            Mentoring Hub
          </h2>
          <p className="text-muted-foreground mt-1">
            Connect with mentors and grow your skills
          </p>
        </div>

        {mentorStats && (
          <Card className="bg-gradient-to-br from-yellow-900/20 to-amber-900/20 border-yellow-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Award className="w-10 h-10 text-yellow-400" />
                <div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {mentorStats.total_mentees || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Mentees Helped</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">
            <Target className="w-4 h-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="find-mentor">
            <Sparkles className="w-4 h-4 mr-2" />
            Find Mentor
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
            <Card className="bg-card/50 border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-card-foreground">
                      {relationships.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Active Relationships</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-400" />
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-card-foreground">
                      {sessions.filter(s => s.status === 'completed').length}
                    </div>
                    <div className="text-xs text-muted-foreground">Sessions Completed</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-card-foreground">
                      {goals.filter(g => g.status === 'achieved').length}
                    </div>
                    <div className="text-xs text-muted-foreground">Goals Achieved</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-400" />
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-card-foreground">
                      {mentorProfiles.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Available Mentors</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommended Matches */}
          {recommendedMatches.length > 0 && (
            <Card className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-purple-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                  Recommended Mentors for You
                </CardTitle>
                <CardDescription>
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
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle>Your Mentoring Relationships</CardTitle>
              <CardDescription>
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

        {/* Find Mentor Tab */}
        <TabsContent value="find-mentor" className="space-y-6">
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle>Browse Available Mentors</CardTitle>
              <CardDescription>
                {mentorProfiles.filter(m => m.availableSlots > 0).length} mentors available to help you grow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {mentorProfiles
                  .filter(m => m.availableSlots > 0 && m.id !== currentUserId)
                  .map(mentor => {
                    const match = recommendedMatches.find(m => m.mentorId === mentor.id);
                    return renderMentorCard(mentor, match);
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Mentoring Tab */}
        <TabsContent value="my-mentoring" className="space-y-6">
          {relationships.length === 0 ? (
            <Card className="bg-card/50 border-border">
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Mentoring Relationships Yet</h3>
                <p className="text-muted-foreground mb-6">
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
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Match Score:</span>
                  <span className="text-primary font-bold">{selectedMatch.matchScore}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Skills Match:</span>
                  <span>{selectedMatch.matchedSkills.join(', ')}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedMatch.rationale}
              </p>
              <div className="space-y-2">
                <Label>Suggested Goals:</Label>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {selectedMatch.suggestedGoals.map((goal, idx) => (
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
            <Button onClick={confirmRequestMentorship}>
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

