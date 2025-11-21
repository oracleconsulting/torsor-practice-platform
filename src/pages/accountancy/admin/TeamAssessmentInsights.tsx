/**
 * Team Assessment Insights Dashboard
 * Comprehensive overview of all team assessments for strategic team development
 */

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity } from 'lucide-react';

// Tab Components
import { OverviewTab } from '@/components/accountancy/team/insights/OverviewTab';
import { StrategicTab } from '@/components/accountancy/team/insights/StrategicTab';
import { CompositionTab } from '@/components/accountancy/team/insights/CompositionTab';

// Custom Hooks
import { useTeamAssessmentData } from '@/hooks/useTeamAssessmentData';
import { useStrategicInsights } from '@/hooks/useStrategicInsights';
import { useAIGeneration } from '@/hooks/useAIGeneration';

const TeamAssessmentInsights: React.FC = () => {
  // Custom Hooks - Data Loading
  const { loading, teamMembers, completionStatus, teamComposition, teamDynamics } = 
    useTeamAssessmentData();

  // Custom Hooks - Strategic Insights
  const { individualInsights, strategicTeamInsight, calculatingStrategic, calculateStrategicInsights } = 
    useStrategicInsights(teamMembers);

  // Custom Hooks - AI Generation
  const { compositionAnalysis, gapAnalysis, generatingComposition, generatingGap, 
    generateCompositionAnalysis, generateGapAnalysis } = 
    useAIGeneration();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading team insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Team Assessment Insights</h1>
        <p className="text-gray-600 mt-2">
          Comprehensive team development insights powered by multi-dimensional assessments
        </p>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview & Completion</TabsTrigger>
          <TabsTrigger value="strategic">Strategic Insights</TabsTrigger>
          <TabsTrigger value="composition">Team Composition</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <OverviewTab
            loading={loading}
            completionStatus={completionStatus}
            teamMembers={teamMembers}
          />
        </TabsContent>

        {/* Strategic Insights Tab */}
        <TabsContent value="strategic">
          <StrategicTab
            loading={loading}
            individualInsights={individualInsights}
            strategicTeamInsight={strategicTeamInsight}
            calculatingStrategic={calculatingStrategic}
            onCalculateStrategic={calculateStrategicInsights}
          />
        </TabsContent>

        {/* Team Composition Tab */}
        <TabsContent value="composition">
          <CompositionTab
            loading={loading}
            teamComposition={teamComposition}
            teamDynamics={teamDynamics}
            teamMembers={teamMembers}
            compositionAnalysis={compositionAnalysis}
            gapAnalysis={gapAnalysis}
            generatingComposition={generatingComposition}
            generatingGap={generatingGap}
            onGenerateComposition={generateCompositionAnalysis}
            onGenerateGapAnalysis={generateGapAnalysis}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamAssessmentInsights;
