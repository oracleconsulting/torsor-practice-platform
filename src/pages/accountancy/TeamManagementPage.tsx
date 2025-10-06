import React, { useState } from 'react';
import { Users, Award, BookOpen, TrendingUp, BarChart2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CPDTrackerPage from './team/CPDTrackerPage';
import AdvisorySkillsPage from './team/AdvisorySkillsPage';
import KPIManagementPage from './team/KPIManagementPage';
import KnowledgeBasePage from './team/KnowledgeBasePage';

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
  const [activeTab, setActiveTab] = useState('cpd');

  const tabs = [
    {
      value: 'cpd',
      label: 'CPD TRACKER',
      icon: Award,
      component: CPDTrackerPage,
    },
    {
      value: 'advisory',
      label: 'ADVISORY SKILLS',
      icon: TrendingUp,
      component: AdvisorySkillsPage,
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
          <h1 className="text-5xl font-black uppercase text-white mb-2 drop-shadow-lg">
            TEAM DEVELOPMENT HUB
          </h1>
          <p className="text-xl text-white font-bold uppercase drop-shadow-md">
            BUILD ADVISORY CONFIDENCE AND CAPABILITY ACROSS YOUR TEAM
          </p>
        </div>
      </div>
      
      {/* Page Content */}
      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 gap-4 bg-[#1a2b4a] p-1 h-auto border-2 border-[#ff6b35]">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex flex-col items-center justify-center p-4 h-auto space-y-2 data-[state=active]:bg-[#ff6b35] data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-[#1a2b4a] font-black uppercase transition-all duration-300"
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-sm font-black uppercase">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-6">
              <tab.component />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default TeamManagementPage; 