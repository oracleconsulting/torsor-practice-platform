import React, { useState } from 'react';
import { Award, BookOpen, TrendingUp, BarChart2, Mail, LayoutDashboard, Target, Users, CheckCircle } from 'lucide-react';
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
import OnboardingAdminPage from './team/OnboardingAdminPage';

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
  const [activeTab, setActiveTab] = useState('invitations');

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
      value: 'onboarding',
      label: 'ONBOARDING',
      icon: CheckCircle,
      component: OnboardingAdminPage,
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
      
      {/* Page Content */}
      <div className="relative z-10 container mx-auto px-6 py-12 max-w-7xl">
        {/* Tabs - Centered Card Grid */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-12">
          {/* Tab Buttons - Spacious Card Grid */}
          <TabsList className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 bg-transparent p-0 h-auto">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex flex-col items-center justify-center gap-4 p-6 h-32 bg-white border-2 border-[#1a2b4a] data-[state=active]:bg-[#ff6b35] data-[state=active]:border-[#ff6b35] data-[state=active]:text-white data-[state=inactive]:text-[#1a2b4a] font-bold transition-all duration-300 relative rounded-lg hover:bg-[#ff6b35] hover:border-[#ff6b35] hover:text-white shadow-md hover:shadow-xl hover:scale-105"
              >
                {tab.badge && (
                  <Badge className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 font-bold">
                    {tab.badge}
                  </Badge>
                )}
                <tab.icon className="w-10 h-10 flex-shrink-0" />
                <span className="text-sm font-black uppercase text-center leading-tight">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab Content */}
          {tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-0">
              <tab.component />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default TeamManagementPage; 