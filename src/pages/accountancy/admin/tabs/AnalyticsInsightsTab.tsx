import React, { useState } from 'react';
import { BarChart2, TrendingUp, Sparkles, Briefcase } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AnalyticsDashboardPage from '../../team/AnalyticsDashboardPage';
import KPIManagementPage from '../../team/KPIManagementPage';
import ServiceLinePreferencesAdmin from '../ServiceLinePreferencesAdmin';
import RoleDefinitionsAdminPanel from '../RoleDefinitionsAdminPanel';

/**
 * Analytics & Insights Tab - All analytics, KPIs, and strategic insights
 * 
 * Consolidates 4 tabs:
 * - ANALYTICS
 * - KPI MANAGEMENT
 * - SERVICE LINE PREFERENCES
 * - ROLE DEFINITIONS
 */
const AnalyticsInsightsTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState('analytics');

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <Card className="border-2 border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="text-2xl font-black uppercase flex items-center gap-3">
            <BarChart2 className="w-8 h-8 text-purple-600" />
            Analytics & Insights
          </CardTitle>
          <CardDescription className="text-base">
            Performance metrics, KPIs, service line strategy, and role definitions
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Sub-navigation */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 gap-2 bg-gray-100 p-2 rounded-lg">
          <TabsTrigger
            value="analytics"
            className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
          >
            <BarChart2 className="w-4 h-4" />
            <span className="font-semibold">Analytics Dashboard</span>
          </TabsTrigger>
          <TabsTrigger
            value="kpi"
            className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
          >
            <TrendingUp className="w-4 h-4" />
            <span className="font-semibold">KPI Management</span>
          </TabsTrigger>
          <TabsTrigger
            value="service-lines"
            className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
          >
            <Sparkles className="w-4 h-4" />
            <span className="font-semibold">Service Lines</span>
          </TabsTrigger>
          <TabsTrigger
            value="roles"
            className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
          >
            <Briefcase className="w-4 h-4" />
            <span className="font-semibold">Role Definitions</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <AnalyticsDashboardPage />
        </TabsContent>

        <TabsContent value="kpi">
          <KPIManagementPage />
        </TabsContent>

        <TabsContent value="service-lines">
          <ServiceLinePreferencesAdmin />
        </TabsContent>

        <TabsContent value="roles">
          <RoleDefinitionsAdminPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsInsightsTab;

