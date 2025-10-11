/**
 * Skills Dashboard V2 - Redesigned with Progressive Disclosure
 * PROMPT 3 Implementation
 * 
 * Features:
 * - 3-section layout (My Skills Journey, Team Intelligence, Development Hub)
 * - Role-based view switching
 * - Keyboard navigation (J/K)
 * - Command palette (Cmd+K)
 * - Mobile responsive
 * - Lazy loading
 * - Guided tour
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  User, 
  Users, 
  GraduationCap, 
  TrendingUp, 
  Award, 
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  BookOpen,
  Sparkles,
  Play,
  Command,
  Menu,
  X
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load heavy components
const SkillsMatrix = lazy(() => import('./SkillsMatrix'));
const GapAnalysis = lazy(() => import('./GapAnalysis'));

// Types
export interface SkillsDashboardV2Props {
  teamMembers: any[];
  skillCategories: any[];
}

type ViewMode = 'personal' | 'manager' | 'admin';
type Section = 'journey' | 'team' | 'development';

const SkillsDashboardV2: React.FC<SkillsDashboardV2Props> = ({
  teamMembers,
  skillCategories
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('personal');
  const [activeSection, setActiveSection] = useState<Section>('journey');
  const [expandedSections, setExpandedSections] = useState<string[]>(['journey']);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showGuidedTour, setShowGuidedTour] = useState(false);

  // Get current user's data
  const currentMember = teamMembers.find(m => m.email === user?.email) || teamMembers[0];
  const userSkills = currentMember?.skills || [];
  
  // Calculate personal stats
  const totalSkills = skillCategories.reduce((sum, cat) => sum + cat.skills.length, 0);
  const assessedSkills = userSkills.length;
  const assessmentProgress = totalSkills > 0 ? (assessedSkills / totalSkills) * 100 : 0;
  const averageSkillLevel = userSkills.length > 0 
    ? userSkills.reduce((sum: number, s: any) => sum + s.currentLevel, 0) / userSkills.length 
    : 0;
  
  // Calculate CPD hours (mock for now - would come from API)
  const cpdHoursCompleted = 12;
  const cpdHoursRequired = 40;
  const cpdProgress = (cpdHoursCompleted / cpdHoursRequired) * 100;

  // Team stats
  const teamCapabilityScore = Math.round(
    teamMembers.reduce((sum, m) => sum + (m.overallScore || 0), 0) / (teamMembers.length || 1)
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Command palette (Cmd+K or Ctrl+K)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
        return;
      }

      // Section navigation (J/K)
      if (!showCommandPalette) {
        if (e.key === 'j' || e.key === 'J') {
          // Next section
          const sections: Section[] = ['journey', 'team', 'development'];
          const currentIndex = sections.indexOf(activeSection);
          const nextIndex = (currentIndex + 1) % sections.length;
          setActiveSection(sections[nextIndex]);
          setExpandedSections([sections[nextIndex]]);
        } else if (e.key === 'k' || e.key === 'K') {
          // Previous section
          const sections: Section[] = ['journey', 'team', 'development'];
          const currentIndex = sections.indexOf(activeSection);
          const prevIndex = currentIndex === 0 ? sections.length - 1 : currentIndex - 1;
          setActiveSection(sections[prevIndex]);
          setExpandedSections([sections[prevIndex]]);
        }
      }

      // Close command palette on Escape
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
        setShowMobileMenu(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [activeSection, showCommandPalette]);

  // Check if first time user
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('skills-dashboard-tour-seen');
    if (!hasSeenTour && currentMember) {
      setShowGuidedTour(true);
    }
  }, [currentMember]);

  // Role-based view determination
  const getUserRole = (): ViewMode => {
    if (user?.role === 'admin' || user?.role === 'super_admin') return 'admin';
    if (user?.role === 'manager' || teamMembers.length > 1) return 'manager';
    return 'personal';
  };

  useEffect(() => {
    setViewMode(getUserRole());
  }, [user]);

  // Command palette actions
  const commandActions = [
    { id: 'start-assessment', label: 'Start Skills Assessment', icon: Play, action: () => navigate('/accountancy/team-portal/vark-assessment') },
    { id: 'view-gaps', label: 'View Gap Analysis', icon: Target, action: () => setExpandedSections(['team']) },
    { id: 'log-cpd', label: 'Log CPD Activity', icon: BookOpen, action: () => toast({ title: 'CPD Logger', description: 'Opening CPD activity logger...' }) },
    { id: 'find-mentor', label: 'Find a Mentor', icon: Users, action: () => toast({ title: 'Mentor Matching', description: 'Finding mentors for you...' }) },
    { id: 'view-training', label: 'View Training Catalog', icon: GraduationCap, action: () => toast({ title: 'Training Catalog', description: 'Loading training recommendations...' }) },
  ];

  const handleCommandAction = (action: () => void) => {
    action();
    setShowCommandPalette(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Title */}
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <div>
                <h1 className="text-xl font-bold text-white">Skills Dashboard</h1>
                <p className="text-xs text-gray-300">Track, develop, and excel</p>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              {/* View Mode Switcher */}
              {(user?.role === 'manager' || user?.role === 'admin') && (
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'personal' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('personal')}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Personal
                  </Button>
                  <Button
                    variant={viewMode === 'manager' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('manager')}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Manager
                  </Button>
                  {user?.role === 'admin' && (
                    <Button
                      variant={viewMode === 'admin' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('admin')}
                    >
                      <Award className="w-4 h-4 mr-2" />
                      Admin
                    </Button>
                  )}
                </div>
              )}

              {/* Command Palette Trigger */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCommandPalette(true)}
                className="hidden lg:flex items-center gap-2"
              >
                <Command className="w-4 h-4" />
                <span className="text-xs text-gray-300">⌘K</span>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-700 bg-gray-800 p-4 space-y-2">
            {commandActions.map(action => (
              <Button
                key={action.id}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  action.action();
                  setShowMobileMenu(false);
                }}
              >
                <action.icon className="w-4 h-4 mr-3" />
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Accordion
          type="multiple"
          value={expandedSections}
          onValueChange={setExpandedSections}
          className="space-y-6"
        >
          {/* SECTION 1: My Skills Journey */}
          <AccordionItem value="journey" className="border-none">
            <Card className="bg-gray-800 border-gray-700">
              <AccordionTrigger className="hover:no-underline px-6 py-4">
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <User className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <h2 className="text-lg font-semibold text-white">My Skills Journey</h2>
                    <p className="text-sm text-gray-300">Personal development and progress</p>
                  </div>
                  {expandedSections.includes('journey') && (
                    <Badge variant="outline" className="text-green-400 border-green-500">
                      Active
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="pt-6 space-y-6">
                  {/* Progress Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Assessment Progress */}
                    <Card className="bg-gray-900 border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-300">Skills Assessed</span>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="text-2xl font-bold text-white mb-2">
                          {assessedSkills}/{totalSkills}
                        </div>
                        <Progress value={assessmentProgress} className="h-2" />
                        <p className="text-xs text-gray-300 mt-2">{Math.round(assessmentProgress)}% complete</p>
                      </CardContent>
                    </Card>

                    {/* Average Skill Level */}
                    <Card className="bg-gray-900 border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-300">Average Level</span>
                          <TrendingUp className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="text-2xl font-bold text-white mb-2">
                          {averageSkillLevel.toFixed(1)}/5
                        </div>
                        <Progress value={(averageSkillLevel / 5) * 100} className="h-2" />
                        <p className="text-xs text-gray-300 mt-2">
                          {averageSkillLevel >= 3.5 ? 'Strong performer' : 'Room to grow'}
                        </p>
                      </CardContent>
                    </Card>

                    {/* CPD Hours */}
                    <Card className="bg-gray-900 border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-300">CPD Hours</span>
                          <Clock className="w-4 h-4 text-yellow-500" />
                        </div>
                        <div className="text-2xl font-bold text-white mb-2">
                          {cpdHoursCompleted}/{cpdHoursRequired}
                        </div>
                        <Progress value={cpdProgress} className="h-2" />
                        <p className="text-xs text-gray-300 mt-2">{cpdHoursRequired - cpdHoursCompleted}h remaining</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Current Assessments Due */}
                  <Card className="bg-gray-900 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-sm text-white">Recommended Next Actions</CardTitle>
                      <CardDescription>Complete these to unlock your potential</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {assessmentProgress < 100 && (
                        <div className="flex items-center gap-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                          <Play className="w-5 h-5 text-purple-400" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">Complete Skills Assessment</p>
                            <p className="text-xs text-gray-300">
                              {totalSkills - assessedSkills} skills remaining
                            </p>
                          </div>
                          <Button size="sm" onClick={(e) => {
                            e.preventDefault();
                            window.location.href = '/team-portal/assessment';
                          }}>
                            Start
                          </Button>
                        </div>
                      )}
                      
                      {cpdProgress < 100 && (
                        <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <BookOpen className="w-5 h-5 text-yellow-400" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">Log CPD Activity</p>
                            <p className="text-xs text-gray-300">
                              {cpdHoursRequired - cpdHoursCompleted} hours to goal
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            Log Now
                          </Button>
                        </div>
                      )}

                      <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <Sparkles className="w-5 h-5 text-blue-300" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">View AI Recommendations</p>
                          <p className="text-xs text-gray-300">
                            Personalized training suggestions
                          </p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setExpandedSections(['team'])}>
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Personal Development Plan */}
                  <Card className="bg-gray-900 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-sm text-white">Your Development Plan</CardTitle>
                      <CardDescription>Skills you're actively developing</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {userSkills.length > 0 ? (
                        <div className="space-y-3">
                          {userSkills.slice(0, 3).map((skill: any) => (
                            <div key={skill.skillId} className="flex items-center gap-3">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-white">{skill.skillName || 'Skill'}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Progress value={(skill.currentLevel / 5) * 100} className="h-1 flex-1" />
                                  <span className="text-xs text-gray-300">{skill.currentLevel}/5</span>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {skill.interestLevel >= 4 ? 'High Interest' : 'In Progress'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-300">
                          <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">Start an assessment to build your development plan</p>
                          <Button className="mt-4" size="sm" onClick={(e) => {
                            e.preventDefault();
                            window.location.href = '/team-portal/assessment';
                          }}>
                            Begin Assessment
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* SECTION 2: Team Intelligence (Collapsed by default) */}
          {(viewMode === 'manager' || viewMode === 'admin') && (
            <AccordionItem value="team" className="border-none">
              <Card className="bg-gray-800 border-gray-700">
                <AccordionTrigger className="hover:no-underline px-6 py-4">
                  <div className="flex items-center gap-3 w-full">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Users className="w-5 h-5 text-blue-300" />
                    </div>
                    <div className="flex-1 text-left">
                      <h2 className="text-lg font-semibold text-white">Team Intelligence</h2>
                      <p className="text-sm text-gray-300">Skills heatmap and team insights</p>
                    </div>
                    <Badge variant="outline" className="text-blue-300 border-blue-500">
                      {teamCapabilityScore}% Capability
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="pt-6 space-y-6">
                    {/* Critical Gaps Alert */}
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                        <div>
                          <h3 className="text-sm font-semibold text-red-400">Critical Skills Gaps Detected</h3>
                          <p className="text-sm text-gray-300 mt-1">
                            3 high-priority skills need immediate attention
                          </p>
                          <Button size="sm" variant="outline" className="mt-3" onClick={() => setExpandedSections(['development'])}>
                            View Recommendations
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Team Capability Score */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-gray-900 border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-sm text-white">Team Capability</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-white mb-2">{teamCapabilityScore}%</div>
                          <Progress value={teamCapabilityScore} className="h-2 mb-2" />
                          <p className="text-xs text-gray-300">
                            {teamCapabilityScore >= 75 ? 'Strong team' : 'Growing team'}
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-900 border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-sm text-white">Top Performers</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {teamMembers.slice(0, 3).map((member, idx) => (
                            <div key={member.id} className="flex items-center gap-2">
                              <Badge variant="outline" className="w-6 h-6 p-0 justify-center">
                                {idx + 1}
                              </Badge>
                              <span className="text-sm text-white">{member.name}</span>
                              <span className="text-xs text-gray-300 ml-auto">{member.overallScore || 0}%</span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Skills Heatmap */}
                    <Card className="bg-gray-900 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-sm text-white">Skills Heatmap</CardTitle>
                        <CardDescription>Team-wide skill distribution</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {teamMembers.length > 0 && skillCategories.length > 0 ? (
                          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                            <SkillsMatrix
                              teamMembers={teamMembers.filter(m => m && m.id)}
                              skillCategories={skillCategories.filter(c => c && c.skills)}
                            />
                          </Suspense>
                        ) : (
                          <div className="text-center py-12 text-gray-300">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">Complete your assessment to see the team heatmap</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Gap Analysis */}
                    {teamMembers.length > 0 && skillCategories.length > 0 ? (
                      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                        <GapAnalysis
                          teamMembers={teamMembers.filter(m => m && m.id)}
                          skillCategories={skillCategories.filter(c => c && c.skills)}
                          showHeatmap={true}
                          priorityAlgorithm="weighted"
                        />
                      </Suspense>
                    ) : null}
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          )}

          {/* SECTION 3: Development Hub (Action-focused) */}
          <AccordionItem value="development" className="border-none">
            <Card className="bg-gray-800 border-gray-700">
              <AccordionTrigger className="hover:no-underline px-6 py-4">
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <GraduationCap className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <h2 className="text-lg font-semibold text-white">Development Hub</h2>
                    <p className="text-sm text-gray-300">Training, mentoring, and resources</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="pt-6 space-y-6">
                  {/* Quick Actions Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Start Assessment */}
                    <Card className="bg-white border-gray-300 hover:border-purple-500 hover:shadow-xl transition-all cursor-pointer shadow-md"
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.href = '/team-portal/assessment';
                          }}>
                      <CardContent className="p-6 text-center">
                        <Play className="w-10 h-10 text-purple-600 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-gray-900 mb-2">Quick Assessment</h3>
                        <p className="text-sm text-gray-600">Launch skills evaluation</p>
                      </CardContent>
                    </Card>

                    {/* Training Catalog */}
                    <Card className="bg-white border-gray-300 hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer shadow-md"
                          onClick={() => navigate('/accountancy/team-portal/training-recommendations')}>
                      <CardContent className="p-6 text-center">
                        <BookOpen className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-gray-900 mb-2">Training Catalog</h3>
                        <p className="text-sm text-gray-600">Browse courses</p>
                      </CardContent>
                    </Card>

                    {/* Find Mentor */}
                    <Card className="bg-white border-gray-300 hover:border-green-500 hover:shadow-xl transition-all cursor-pointer shadow-md"
                          onClick={() => navigate('/accountancy/team-portal/mentoring')}>
                      <CardContent className="p-6 text-center">
                        <Users className="w-10 h-10 text-green-600 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-gray-900 mb-2">Find a Mentor</h3>
                        <p className="text-sm text-gray-600">Connect with experts</p>
                      </CardContent>
                    </Card>

                    {/* Log CPD */}
                    <Card className="bg-white border-gray-300 hover:border-yellow-500 hover:shadow-xl transition-all cursor-pointer shadow-md"
                          onClick={() => navigate('/accountancy/team-portal/cpd-skills-impact')}>
                      <CardContent className="p-6 text-center">
                        <Clock className="w-10 h-10 text-yellow-600 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-gray-900 mb-2">Log CPD Activity</h3>
                        <p className="text-sm text-gray-600">Track your learning</p>
                      </CardContent>
                    </Card>

                    {/* AI Recommendations */}
                    <Card className="bg-white border-gray-300 hover:border-pink-500 hover:shadow-xl transition-all cursor-pointer shadow-md"
                          onClick={() => navigate('/accountancy/team-portal/training-recommendations')}>
                      <CardContent className="p-6 text-center">
                        <Sparkles className="w-10 h-10 text-pink-600 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-gray-900 mb-2">AI Recommendations</h3>
                        <p className="text-sm text-gray-600">Personalized suggestions</p>
                      </CardContent>
                    </Card>

                    {/* Resources Library */}
                    <Card className="bg-white border-gray-300 hover:border-orange-500 hover:shadow-xl transition-all cursor-pointer shadow-md">
                      <CardContent className="p-6 text-center">
                        <GraduationCap className="w-10 h-10 text-orange-600 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-gray-900 mb-2">Resources Library</h3>
                        <p className="text-sm text-gray-600">Guides and articles</p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Command Palette */}
      {showCommandPalette && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
          <Card className="w-full max-w-2xl mx-4 bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Command className="w-5 h-5 text-purple-400" />
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </div>
              <CardDescription>Navigate and take action quickly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {commandActions.map(action => (
                <Button
                  key={action.id}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleCommandAction(action.action)}
                >
                  <action.icon className="w-4 h-4 mr-3" />
                  {action.label}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 md:hidden z-30">
        <div className="grid grid-cols-3 gap-1 p-2">
          <Button
            variant={activeSection === 'journey' ? 'default' : 'ghost'}
            className="flex-col h-auto py-3"
            onClick={() => {
              setActiveSection('journey');
              setExpandedSections(['journey']);
            }}
          >
            <User className="w-5 h-5 mb-1" />
            <span className="text-xs">Journey</span>
          </Button>
          
          {(viewMode === 'manager' || viewMode === 'admin') && (
            <Button
              variant={activeSection === 'team' ? 'default' : 'ghost'}
              className="flex-col h-auto py-3"
              onClick={() => {
                setActiveSection('team');
                setExpandedSections(['team']);
              }}
            >
              <Users className="w-5 h-5 mb-1" />
              <span className="text-xs">Team</span>
            </Button>
          )}
          
          <Button
            variant={activeSection === 'development' ? 'default' : 'ghost'}
            className="flex-col h-auto py-3"
            onClick={() => {
              setActiveSection('development');
              setExpandedSections(['development']);
            }}
          >
            <GraduationCap className="w-5 h-5 mb-1" />
            <span className="text-xs">Develop</span>
          </Button>
        </div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="fixed bottom-4 right-4 hidden lg:block">
        <Card className="bg-gray-800 border-gray-700 p-3">
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <kbd className="px-2 py-1 bg-gray-700 rounded border border-gray-600">J</kbd>
            <kbd className="px-2 py-1 bg-gray-700 rounded border border-gray-600">K</kbd>
            <span>Navigate sections</span>
            <span className="mx-2">•</span>
            <kbd className="px-2 py-1 bg-gray-700 rounded border border-gray-600">⌘K</kbd>
            <span>Commands</span>
          </div>
        </Card>
      </div>

      {/* Guided Tour Tooltip */}
      {showGuidedTour && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Welcome to Skills Dashboard V2!
              </CardTitle>
              <CardDescription>Let's take a quick tour</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-300">
                This new dashboard has 3 main sections:
              </p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <User className="w-4 h-4 mt-0.5 text-purple-400" />
                  <span><strong>My Skills Journey</strong> - Track your personal progress</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users className="w-4 h-4 mt-0.5 text-blue-300" />
                  <span><strong>Team Intelligence</strong> - View team insights (managers only)</span>
                </li>
                <li className="flex items-start gap-2">
                  <GraduationCap className="w-4 h-4 mt-0.5 text-green-400" />
                  <span><strong>Development Hub</strong> - Access training and resources</span>
                </li>
              </ul>
              <p className="text-xs text-gray-300">
                💡 Tip: Use <kbd className="px-2 py-1 bg-gray-700 rounded">J</kbd>/<kbd className="px-2 py-1 bg-gray-700 rounded">K</kbd> keys to navigate or <kbd className="px-2 py-1 bg-gray-700 rounded">⌘K</kbd> for quick actions
              </p>
            </CardContent>
            <CardContent className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowGuidedTour(false);
                  localStorage.setItem('skills-dashboard-tour-seen', 'true');
                }}
              >
                Skip
              </Button>
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                onClick={() => {
                  setShowGuidedTour(false);
                  localStorage.setItem('skills-dashboard-tour-seen', 'true');
                  toast({ title: 'Welcome!', description: 'Start by completing your skills assessment' });
                }}
              >
                Get Started
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SkillsDashboardV2;

