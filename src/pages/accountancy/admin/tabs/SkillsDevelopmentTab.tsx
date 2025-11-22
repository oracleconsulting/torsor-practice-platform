import React, { useState } from 'react';
import { Target, TrendingUp, GraduationCap, Users as UsersIcon, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SkillsDashboardV2Page from '../../team/SkillsDashboardV2Page';
import SkillsManagementPage from '../../team/SkillsManagementPage';
import TrainingRecommendationsPage from '../../team/TrainingRecommendationsPage';
import MentoringHubPage from '../../team/MentoringHubPage';
import CPDTrackerPage from '../../team/CPDTrackerPage';

/**
 * Skills & Development Tab - All skills, training, and development
 * 
 * Consolidates 5 tabs:
 * - ADVISORY SKILLS (V2)
 * - SKILLS MANAGEMENT
 * - TRAINING
 * - MENTORING
 * - CPD TRACKER
 */
const SkillsDevelopmentTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState('advisory');

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <Card className="border-2 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="text-2xl font-black uppercase flex items-center gap-3">
            <Target className="w-8 h-8 text-green-600" />
            Skills & Development
          </CardTitle>
          <CardDescription className="text-base">
            Advisory skills matrix, training plans, mentoring programs, and CPD tracking
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Sub-navigation */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-4">
        <TabsList className="grid grid-cols-5 gap-2 bg-gray-100 p-2 rounded-lg">
          <TabsTrigger
            value="advisory"
            className="flex items-center gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white"
          >
            <TrendingUp className="w-4 h-4" />
            <span className="font-semibold">Advisory Skills</span>
          </TabsTrigger>
          <TabsTrigger
            value="management"
            className="flex items-center gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white"
          >
            <Target className="w-4 h-4" />
            <span className="font-semibold">Skills Management</span>
          </TabsTrigger>
          <TabsTrigger
            value="training"
            className="flex items-center gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white"
          >
            <GraduationCap className="w-4 h-4" />
            <span className="font-semibold">Training</span>
          </TabsTrigger>
          <TabsTrigger
            value="mentoring"
            className="flex items-center gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white"
          >
            <UsersIcon className="w-4 h-4" />
            <span className="font-semibold">Mentoring</span>
          </TabsTrigger>
          <TabsTrigger
            value="cpd"
            className="flex items-center gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white"
          >
            <Award className="w-4 h-4" />
            <span className="font-semibold">CPD Tracker</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="advisory">
          <SkillsDashboardV2Page />
        </TabsContent>

        <TabsContent value="management">
          <SkillsManagementPage />
        </TabsContent>

        <TabsContent value="training">
          <TrainingRecommendationsPage />
        </TabsContent>

        <TabsContent value="mentoring">
          <MentoringHubPage />
        </TabsContent>

        <TabsContent value="cpd">
          <CPDTrackerPage />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SkillsDevelopmentTab;

