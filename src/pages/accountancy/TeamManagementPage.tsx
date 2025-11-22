import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Target, BarChart2, BookOpen, Settings, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardTab from './admin/tabs/DashboardTab';
import TeamAssessmentsTab from './admin/tabs/TeamAssessmentsTab';
import SkillsDevelopmentTab from './admin/tabs/SkillsDevelopmentTab';
import AnalyticsInsightsTab from './admin/tabs/AnalyticsInsightsTab';
import KnowledgeSupportTab from './admin/tabs/KnowledgeSupportTab';
import SettingsTab from './admin/tabs/SettingsTab';

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
  const [activeTab, setActiveTab] = useState('dashboard');

  // Read tab from URL params on mount and when params change
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // SIMPLIFIED: 6 core tabs instead of 17!
  const tabs = [
    {
      value: 'dashboard',
      label: 'DASHBOARD',
      icon: LayoutDashboard,
      component: DashboardTab,
      description: 'Overview & quick actions'
    },
    {
      value: 'team',
      label: 'TEAM & ASSESSMENTS',
      icon: Users,
      component: TeamAssessmentsTab,
      description: 'Invitations, assessments, profiles'
    },
    {
      value: 'skills',
      label: 'SKILLS & DEVELOPMENT',
      icon: Target,
      component: SkillsDevelopmentTab,
      description: 'Skills, training, mentoring, CPD'
    },
    {
      value: 'analytics',
      label: 'ANALYTICS & INSIGHTS',
      icon: BarChart2,
      component: AnalyticsInsightsTab,
      description: 'Analytics, KPIs, service lines'
    },
    {
      value: 'knowledge',
      label: 'KNOWLEDGE & SUPPORT',
      icon: BookOpen,
      component: KnowledgeSupportTab,
      description: 'Knowledge base & tickets'
    },
    {
      value: 'settings',
      label: 'SETTINGS',
      icon: Settings,
      component: SettingsTab,
      description: 'AI & system configuration'
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
                <Star className="h-5 w-5 mr-2" />
                View Capability Matrix
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Page Content */}
      <div className="relative z-10 container mx-auto px-6 py-8">
        {/* Tabs - SIMPLIFIED: Single row with 6 tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-6 gap-3 bg-[#1a2b4a] p-3 border-4 border-[#ff6b35] h-auto max-w-7xl mx-auto rounded-lg shadow-2xl">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex flex-col items-center justify-center gap-2 p-4 h-24 data-[state=active]:bg-[#ff6b35] data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-[#1a2b4a] font-bold transition-all duration-200 rounded-lg hover:bg-[#ff6b35]/90 hover:text-white shadow-md"
              >
                <tab.icon className="w-7 h-7" />
                <div className="text-center">
                  <div className="text-sm font-black uppercase leading-tight">{tab.label}</div>
                  <div className="text-[10px] font-normal mt-0.5 opacity-75">{tab.description}</div>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab Content */}
          <div className="mt-8">
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