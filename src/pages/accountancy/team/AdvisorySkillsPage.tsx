import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Settings, Play } from 'lucide-react';

// Import new design system
import { transitions } from '@/lib/design-tokens';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useSavedViews, useHighContrastMode } from '@/hooks/useSavedViews';

// Import new UI components
import { SidebarNavigation } from '@/components/ui/sidebar-navigation';
import { Breadcrumb, BreadcrumbItem } from '@/components/ui/breadcrumb';
import { KeyboardShortcutsDialog } from '@/components/ui/keyboard-shortcuts-dialog';
import { PageSkeleton } from '@/components/ui/skeleton-loaders';

// Import existing feature components
import SkillsMatrix from '@/components/accountancy/team/SkillsMatrix';
import SkillsAssessment from '@/components/accountancy/team/SkillsAssessment';
import GapAnalysis from '@/components/accountancy/team/GapAnalysis';
import DevelopmentPlanning from '@/components/accountancy/team/DevelopmentPlanning';
import TeamMetrics from '@/components/accountancy/team/TeamMetrics';

// Import new Overview tab
import OverviewTab from '@/components/accountancy/team/OverviewTab';

// Types
interface SkillCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  skills: Skill[];
}

interface Skill {
  id: string;
  name: string;
  description: string;
  requiredLevel: number;
  category: string;
}

interface TeamMemberSkill {
  memberId: string;
  skillId: string;
  currentLevel: number;
  interestLevel?: number;
  targetLevel: number;
  lastAssessed: Date;
  certifications?: string[];
  notes?: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  department: string;
  skills: TeamMemberSkill[];
  overallScore?: number;
}

const AdvisorySkillsPage: React.FC = () => {
  const { toast } = useToast();
  
  console.log('[AdvisorySkillsPage v1.0.4] NEW REDESIGNED UI LOADED - Sidebar should be visible');
  
  // State
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([]);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  
  // Assessment mode
  const [assessmentMode] = useState<'view' | 'assess'>('view');
  const [selectedMemberForAssessment] = useState<TeamMember | null>(null);

  // Custom hooks
  const { isHighContrast, toggleHighContrast } = useHighContrastMode();
  const { currentView, clearCurrentView } = useSavedViews('advisory-skills');

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'g+o', handler: () => setActiveTab('overview'), description: 'Go to Overview' },
    { key: 'g+m', handler: () => setActiveTab('matrix'), description: 'Go to Skills Matrix' },
    { key: 'g+a', handler: () => setActiveTab('assessment'), description: 'Go to Assessment' },
    { key: 'g+g', handler: () => setActiveTab('gaps'), description: 'Go to Gap Analysis' },
    { key: 'g+p', handler: () => setActiveTab('planning'), description: 'Go to Development Planning' },
    { key: 'g+s', handler: () => setActiveTab('skills-analysis'), description: 'Go to Skills Analysis' },
    { key: 'g+t', handler: () => setActiveTab('metrics'), description: 'Go to Team Metrics' },
    { key: 'e', handler: handleExport, description: 'Export Data' },
    { key: '?', handler: () => setShowKeyboardHelp(true), description: 'Show Help' },
  ]);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { supabase } = await import('@/lib/supabase/client');
      
      // Fetch skills
      const { data: allSkills, error: skillsError } = await supabase
        .from('skills')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (skillsError) throw skillsError;
      console.log('Found', allSkills?.length || 0, 'skills in database');

      // Fetch assessments with member info
      const { data: assessments, error: assessmentsError } = await supabase
        .from('skill_assessments')
        .select(`
          *,
          team_member:practice_members!skill_assessments_team_member_id_fkey(
            id,
            name,
            email,
            role
          )
        `)
        .order('assessed_at', { ascending: false });

      if (assessmentsError) {
        console.error('Assessments error:', assessmentsError);
      }

      console.log('📊 Assessments query result:', {
        count: assessments?.length || 0,
        error: assessmentsError,
        sampleData: assessments?.[0]
      });

      // Build team members from assessments
      const memberMap = new Map<string, TeamMember>();
      const uniqueMemberIds = new Set<string>();

      assessments?.forEach((assessment: any) => {
        const memberId = assessment.team_member_id;
        if (!memberId) return;
        
        uniqueMemberIds.add(memberId);
        
        if (!memberMap.has(memberId)) {
          const memberInfo = assessment.team_member;
          memberMap.set(memberId, {
            id: memberId,
            name: memberInfo?.name || 'Unknown',
            email: memberInfo?.email || '',
            role: memberInfo?.role || 'Team Member',
            department: 'Advisory',
            skills: [],
          });
        }
        
        const member = memberMap.get(memberId)!;
        member.skills.push({
          memberId: memberId,
          skillId: assessment.skill_id,
          currentLevel: assessment.current_level || 0,
          interestLevel: assessment.interest_level || 3,
          targetLevel: (assessment.current_level || 0) + 1,
          lastAssessed: new Date(assessment.assessed_at),
          certifications: assessment.certifications || [],
          notes: assessment.notes || '',
        });
      });

      // Fallback: fetch practice_members if no data from join
      if (memberMap.size === 0 && uniqueMemberIds.size > 0) {
        const { data: practiceMembers } = await supabase
          .from('practice_members')
          .select('*');

        practiceMembers?.forEach((pm: any) => {
          if (uniqueMemberIds.has(pm.id) && !memberMap.has(pm.id)) {
            memberMap.set(pm.id, {
              id: pm.id,
              name: pm.name || 'Unknown',
              email: pm.email || '',
              role: pm.role || 'Team Member',
              department: 'Advisory',
              skills: [],
            });
          }
        });
      }

      const loadedMembers = Array.from(memberMap.values());
      console.log('📭 Loaded team members:', loadedMembers.length);

      setTeamMembers(loadedMembers);

      // Build skill categories (simplified)
      const categorizedSkills = new Map<string, Skill[]>();
      allSkills?.forEach((skill: any) => {
        if (!categorizedSkills.has(skill.category)) {
          categorizedSkills.set(skill.category, []);
        }
        categorizedSkills.get(skill.category)!.push({
          id: skill.id,
          name: skill.name,
          description: skill.description || '',
          requiredLevel: skill.required_level || 3,
          category: skill.category,
        });
      });

      const categories: SkillCategory[] = Array.from(categorizedSkills.entries()).map(([category, skills]) => ({
        id: category,
        name: category,
        description: '',
        icon: () => null,
        skills,
      }));

      setSkillCategories(categories);
      setLoading(false);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load skills data',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  function handleExport() {
    toast({
      title: 'Export Started',
      description: 'Preparing your data export...',
    });
    // TODO: Implement export functionality
  }

  // Breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Team', href: '/team' },
    { label: 'Advisory Skills', current: true },
  ];

  // Tab labels for breadcrumb
  const tabLabels: Record<string, string> = {
    overview: 'Overview',
    matrix: 'Skills Matrix',
    assessment: 'Assessment',
    gaps: 'Gap Analysis',
    planning: 'Development Planning',
    'skills-analysis': 'Skills Analysis',
    metrics: 'Team Metrics',
  };

  // Render loading state
  if (loading) {
    return (
      <div className={`min-h-screen bg-gray-50 ${sidebarCollapsed ? 'pl-20' : 'pl-64'} transition-all duration-300`}>
        <PageSkeleton />
      </div>
    );
  }

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            teamMembers={teamMembers}
            skillCategories={skillCategories}
            onNavigate={setActiveTab}
          />
        );
      
      case 'matrix':
        return (
          <SkillsMatrix
            teamMembers={teamMembers}
            skillCategories={skillCategories}
            onSelectMember={setSelectedMember}
            filterOptions={{ category: 'all', role: 'all' }}
          />
        );
      
      case 'assessment':
        return (
          <SkillsAssessment
            member={selectedMemberForAssessment}
            mode={assessmentMode}
            teamMembers={teamMembers}
            skillCategories={skillCategories}
          />
        );
      
      case 'gaps':
        return (
          <GapAnalysis
            teamMembers={teamMembers}
            skillCategories={skillCategories}
            showHeatmap={true}
            priorityAlgorithm="weighted"
          />
        );
      
      case 'planning':
        return (
          <DevelopmentPlanning
            member={selectedMember}
            teamMembers={teamMembers}
            skillCategories={skillCategories}
            autoRecommendations={true}
          />
        );
      
      case 'skills-analysis':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Skills Analysis</h2>
            <p className="text-gray-600">Coming soon - advanced skills analysis features</p>
          </div>
        );
      
      case 'metrics':
        return (
          <TeamMetrics
            teamMembers={teamMembers}
            skillCategories={skillCategories}
            showBenchmarks={false}
            comparePeriods={false}
          />
        );
      
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${isHighContrast ? 'high-contrast' : ''}`}>
      {/* Sidebar Navigation */}
      <SidebarNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Main Content */}
      <div
        className={`${transitions.normal} ${sidebarCollapsed ? 'pl-20' : 'pl-64'}`}
        style={{ minHeight: '100vh' }}
      >
        {/* Sticky Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-4">
            {/* Top Row: Breadcrumbs + Actions */}
            <div className="flex items-center justify-between mb-3">
              <Breadcrumb items={breadcrumbItems} />
              
              <div className="flex items-center gap-2">
                {/* High Contrast Toggle */}
                <Button
                  variant={isHighContrast ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleHighContrast}
                  title="Toggle High Contrast Mode"
                >
                  <span className="text-xs">A</span>
                </Button>

                {/* Settings */}
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>

                {/* Export */}
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>

                {/* Start Assessment */}
                <Button size="sm" onClick={() => setActiveTab('assessment')}>
                  <Play className="w-4 h-4 mr-2" />
                  Start Assessment
                </Button>
              </div>
            </div>

            {/* Bottom Row: Page Title + Current View */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {activeTab !== 'overview' && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setActiveTab('overview')}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    ← Back to Overview
                  </Button>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{tabLabels[activeTab]}</h1>
                  {currentView && (
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        View: {currentView.name}
                      </Badge>
                      <button
                        onClick={clearCurrentView}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-semibold">{teamMembers.length}</span> Members
                </div>
                <div>
                  <span className="font-semibold">{skillCategories.flatMap(c => c.skills).length}</span> Skills
                </div>
                <div>
                  <span className="font-semibold">
                    {teamMembers.reduce((sum, m) => sum + m.skills.length, 0)}
                  </span> Assessments
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <div className={`mx-auto ${activeTab === 'overview' ? 'max-w-7xl' : ''}`}>
            {renderTabContent()}
          </div>
        </main>
      </div>

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        open={showKeyboardHelp}
        onOpenChange={setShowKeyboardHelp}
      />
    </div>
  );
};

export default AdvisorySkillsPage;

