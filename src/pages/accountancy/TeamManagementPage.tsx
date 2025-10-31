import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Award, BookOpen, TrendingUp, BarChart2, Mail, LayoutDashboard, Target, Users, CheckCircle, Sparkles, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import CPDTrackerPage from './team/CPDTrackerPage';
import SkillsDashboardV2Page from './team/SkillsDashboardV2Page';
import KPIManagementPage from './team/KPIManagementPage';
import KnowledgeBasePage from './team/KnowledgeBasePage';
import InvitationsPage from './team/InvitationsPage';
import AdminDashboardPage from './team/AdminDashboardPage';
import TrainingRecommendationsPage from './team/TrainingRecommendationsPage';
import MentoringHubPage from './team/MentoringHubPage';
import AnalyticsDashboardPage from './team/AnalyticsDashboardPage';
import SkillsManagementPage from './team/SkillsManagementPage';
import AISettingsPage from './admin/AISettingsPage';

// Visual Pattern Components
const DiagonalPattern = () => (
  <div 
    className="absolute inset-0 pointer-events-none z-0"
    style={{
      backgroundImage: `repeating-linear-gradient(
        45deg,
        transparent,
        transparent 40px,
        rgba(255, 107, 53, 0.05) 40px,
        rgba(255, 107, 53, 0.05) 80px
      )`,
      opacity: 0.5
    }}
  />
);

const DotPattern = () => (
  <div 
    className="absolute inset-0 pointer-events-none z-0"
    style={{
      backgroundImage: 'radial-gradient(circle, rgba(255, 107, 53, 0.3) 1px, transparent 1px)',
      backgroundSize: '30px 30px',
      opacity: 0.1
    }}
  />
);

const GeometricShape = () => (
  <svg className="absolute bottom-0 left-0 w-full h-32 pointer-events-none z-0" viewBox="0 0 1440 320">
    <polygon 
      points="0,320 480,160 960,240 1440,100 1440,320" 
      fill="#ff6b35" 
      opacity="0.05"
    />
  </svg>
);

const TeamManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('invitations');

  // Read tab from URL params on mount and when params change
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const tabs = [
    {
      value: 'invitations',
      label: 'TEAM INVITATIONS',
      icon: Mail,
      component: InvitationsPage,
    },
    {
      value: 'dashboard',
      label: 'ADMIN DASHBOARD',
      icon: LayoutDashboard,
      component: AdminDashboardPage,
    },
    {
      value: 'advisory',
      label: 'ADVISORY SKILLS',
      icon: TrendingUp,
      component: SkillsDashboardV2Page,
      badge: 'V2',
    },
    {
      value: 'training',
      label: 'TRAINING',
      icon: Target,
      component: TrainingRecommendationsPage,
      badge: 'NEW',
    },
    {
      value: 'mentoring',
      label: 'MENTORING',
      icon: Users,
      component: MentoringHubPage,
      badge: 'NEW',
    },
    {
      value: 'analytics',
      label: 'ANALYTICS',
      icon: BarChart2,
      component: AnalyticsDashboardPage,
      badge: 'NEW',
    },
    {
      value: 'skills',
      label: 'SKILLS MANAGEMENT',
      icon: Target,
      component: SkillsManagementPage,
      badge: 'NEW',
    },
    {
      value: 'cpd',
      label: 'CPD TRACKER',
      icon: Award,
      component: CPDTrackerPage,
    },
    {
      value: 'kpi',
      label: 'KPI MANAGEMENT',
      icon: BarChart2,
      component: KPIManagementPage,
    },
    {
      value: 'knowledge',
      label: 'KNOWLEDGE BASE',
      icon: BookOpen,
      component: KnowledgeBasePage,
    },
    {
      value: 'ai-settings',
      label: 'AI SETTINGS',
      icon: Brain,
      component: AISettingsPage,
      badge: 'NEW',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f1e8] relative">
      <DiagonalPattern />
      
      {/* Page Header */}
      <div className="relative bg-[#1a2b4a] py-16 overflow-hidden border-b-4 border-[#ff6b35]">
        <DotPattern />
        <GeometricShape />
        <div className="relative z-10 container mx-auto px-6">
          <h1 className="text-5xl font-black uppercase mb-2 drop-shadow-lg" style={{ color: '#ffffff' }}>
            TEAM DEVELOPMENT HUB v1.0.3
          </h1>
          <p className="text-xl font-bold uppercase drop-shadow-md" style={{ color: '#ffffff' }}>
            BUILD ADVISORY CONFIDENCE AND CAPABILITY ACROSS YOUR TEAM
          </p>
        </div>
      </div>

      {/* Advisory Capability Matrix - Prominent Feature */}
      <div className="container mx-auto px-6 py-6">
        <Card className="border-4 border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 shadow-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-amber-500 p-4 rounded-full">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 uppercase mb-1">
                    Advisory Services Capability Matrix
                  </h2>
                  <p className="text-gray-700 font-semibold">
                    See which services you can deliver based on your team's skills • Map skills to service lines • Identify training needs
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate('/accountancy/team/advisory-capability')}
                className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-6 text-lg font-bold uppercase shadow-lg"
                size="lg"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                View Capability Matrix
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Page Content */}
      <div className="relative z-10 container mx-auto px-6 py-8">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Buttons - 2 Rows of 5 */}
          <div className="flex flex-col gap-3 max-w-6xl mx-auto">
            {/* Row 1 */}
            <TabsList className="grid grid-cols-5 gap-2 bg-[#1a2b4a] p-2 border-2 border-[#ff6b35] h-auto">
              {tabs.slice(0, 5).map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex flex-col items-center justify-center gap-2 p-3 h-20 data-[state=active]:bg-[#ff6b35] data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-[#1a2b4a] font-bold transition-all duration-200 relative rounded hover:bg-[#ff6b35]/90 hover:text-white"
                >
                  {tab.badge && (
                    <Badge className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1.5 py-0.5">
                      {tab.badge}
                    </Badge>
                  )}
                  <tab.icon className="w-6 h-6" />
                  <span className="text-xs font-bold uppercase leading-tight text-center">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Row 2 */}
            <TabsList className="grid grid-cols-5 gap-2 bg-[#1a2b4a] p-2 border-2 border-[#ff6b35] h-auto">
              {tabs.slice(5, 10).map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex flex-col items-center justify-center gap-2 p-3 h-20 data-[state=active]:bg-[#ff6b35] data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-[#1a2b4a] font-bold transition-all duration-200 relative rounded hover:bg-[#ff6b35]/90 hover:text-white"
                >
                  {tab.badge && (
                    <Badge className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1.5 py-0.5">
                      {tab.badge}
                    </Badge>
                  )}
                  <tab.icon className="w-6 h-6" />
                  <span className="text-xs font-bold uppercase leading-tight text-center">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab Content Below */}
          <div className="mt-6">
            {tabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="m-0">
                <tab.component />
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default TeamManagementPage; 