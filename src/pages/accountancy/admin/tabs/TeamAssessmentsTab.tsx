import React, { useState } from 'react';
import { Mail, User, Users, Activity, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InvitationsPage from '../../team/InvitationsPage';
import MyAssessmentsPanel from '../MyAssessmentsPanel';
import TeamAssessmentsSimple from '../TeamAssessmentsSimple';
import IndividualAssessmentProfilesPage from '../IndividualAssessmentProfilesPage';

/**
 * Team & Assessments Tab - All team and assessment management
 * 
 * Consolidates 4 tabs:
 * - TEAM INVITATIONS
 * - MY ASSESSMENTS
 * - ASSESSMENT INSIGHTS
 * - INDIVIDUAL PROFILES
 */
const TeamAssessmentsTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState('invitations');

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <Card className="border-2 border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-2xl font-black uppercase flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            Team & Assessments
          </CardTitle>
          <CardDescription className="text-base">
            Manage team invitations, view assessment progress, and analyze individual profiles
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Sub-navigation */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 gap-2 bg-gray-100 p-2 rounded-lg">
          <TabsTrigger
            value="invitations"
            className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <Mail className="w-4 h-4" />
            <span className="font-semibold">Team Invitations</span>
          </TabsTrigger>
          <TabsTrigger
            value="my-assessments"
            className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <User className="w-4 h-4" />
            <span className="font-semibold">My Assessments</span>
          </TabsTrigger>
          <TabsTrigger
            value="team-insights"
            className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <Activity className="w-4 h-4" />
            <span className="font-semibold">Team Insights</span>
          </TabsTrigger>
          <TabsTrigger
            value="individual-profiles"
            className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <Users className="w-4 h-4" />
            <span className="font-semibold">Individual Profiles</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invitations">
          <InvitationsPage />
        </TabsContent>

        <TabsContent value="my-assessments">
          <MyAssessmentsPanel />
        </TabsContent>

        <TabsContent value="team-insights">
          <TeamAssessmentsSimple />
        </TabsContent>

        <TabsContent value="individual-profiles">
          <IndividualAssessmentProfilesPage />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamAssessmentsTab;

