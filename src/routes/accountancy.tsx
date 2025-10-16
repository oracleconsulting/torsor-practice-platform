import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoutes';
import AccountancyLayout from '../components/accountancy/layout/AccountancyLayout';
import { useAuth } from '../contexts/AuthContext';
import { useAccountancyContext } from '../contexts/AccountancyContext';

// Import all page components
import AccountancyDashboard from '../pages/AccountancyDashboard';
import { ClientManagementPage } from '../components/accountancy/client-management/ClientManagementPage';
import TeamManagementPage from '../pages/accountancy/TeamManagementPage';
import { AlternateAuditorPage } from '../pages/accountancy/AlternateAuditorPage';
import { MTDCapacityPage } from '../pages/accountancy/MTDCapacityPage';
import { ESGReportingPage } from '../pages/accountancy/ESGReportingPage';
import { ContinuityPlanningPage } from '../pages/accountancy/ContinuityPlanningPage';
import CyberSecurityPage from '../pages/accountancy/CyberSecurityPage';
import TeamWellnessPage from '../pages/accountancy/TeamWellnessPage';
import ManageSubscriptionPage from '../pages/accountancy/ManageSubscriptionPage';
import ComplianceCalendarPage from '../pages/accountancy/ComplianceCalendarPage';
import { HandoverComplaintsPage } from '../pages/accountancy/HandoverComplaintsPage';
import { NewComplaintPage } from '../pages/accountancy/NewComplaintPage';
import { ComplaintDetailsPage } from '../pages/accountancy/ComplaintDetailsPage';
import KPIDashboardPage from '../pages/accountancy/KPIDashboardPage';
import SettingsPage from '../pages/accountancy/SettingsPage';

// Outreach pages
import { OutreachDashboard } from '../components/accountancy/outreach/OutreachDashboard';
import { CampaignPage } from '../components/accountancy/outreach/campaigns/CampaignPage';
import { ContactPage } from '../components/accountancy/outreach/contacts/ContactPage';
import { SchedulePage } from '../components/accountancy/outreach/schedule/SchedulePage';
import ProspectList from '../components/accountancy/outreach/prospects/ProspectList';
import ProspectDetail from '../pages/accountancy/outreach/ProspectDetail';
import PEMonitor from '../components/accountancy/outreach/pe/PEMonitor';
import PEAcquisitionDetail from '../pages/accountancy/outreach/PEAcquisitionDetail';
import Research from '../pages/accountancy/outreach/Research';
import Analytics from '../pages/accountancy/outreach/Analytics';

// Import new page components
import ClientRescues from '../pages/accountancy/ClientRescues';
import AdvisoryServices from '../pages/accountancy/AdvisoryServices';
import ServiceDetailPage from '../pages/ServiceDetailPage';
import PracticeHealth from '../pages/accountancy/PracticeHealth';
import ClientVaultPage from '../pages/accountancy/ClientVaultPage';
import SystemsAuditPage from '../pages/accountancy/SystemsAuditPage';
import AlignmentProgrammePage from '../pages/accountancy/AlignmentProgrammePage';

// Advisory sub-pages
import ForecastingPage from '../pages/accountancy/advisory/ForecastingPage';
import ValuationPage from '../pages/accountancy/advisory/ValuationPage';

// Team sub-pages
import VARKAssessmentPage from '../pages/accountancy/team/VARKAssessmentPage';
import MentoringHubPage from '../pages/accountancy/team/MentoringHubPage';
import OnboardingHubPage from '../pages/accountancy/team/OnboardingHubPage';
import OnboardingAdminPage from '../pages/accountancy/team/OnboardingAdminPage';
import AnalyticsDashboardPage from '../pages/accountancy/team/AnalyticsDashboardPage';
import TrainingRecommendationsPage from '../pages/accountancy/team/TrainingRecommendationsPage';
import CPDSkillsBridgePage from '../pages/accountancy/team/CPDSkillsBridgePage';
import MobileAssessmentPage from '../pages/team-portal/MobileAssessmentPage';
import SkillsAssessmentPage from '../pages/accountancy/team/SkillsAssessmentPage';
import AdvisoryCapabilityMatrix from '../pages/accountancy/team/AdvisoryCapabilityMatrix';
import KnowledgeBasePage from '../pages/accountancy/team/KnowledgeBasePage';
import TeamMemberDashboard from '../pages/accountancy/team/TeamMemberDashboard';
import MyAssignmentsPage from '../pages/accountancy/team/MyAssignmentsPage';

// Add this component for practice selection
const PracticeSelection = () => {
  const { initializePractice, loading } = useAccountancyContext();

  React.useEffect(() => {
    initializePractice();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-white">Loading practice...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Setting up your practice...</h2>
        <p className="text-gray-600 mb-6">
          We're creating your practice profile. This will only take a moment.
        </p>
      </div>
    </div>
  );
};

const AccountancyRoutesWrapper: React.FC = () => {
  const { practice, loading } = useAccountancyContext();
  const practiceId = practice?.id;

  // Show loading state while checking for practice
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If no practice ID after loading, redirect to practice selection
  if (!practiceId && !loading) {
    return <Navigate to="/accountancy/select-practice" replace />;
  }

  console.log('[AccountancyRoutesWrapper] Rendering routes');
  
  return (
    <Routes>
      <Route index element={<Navigate to="/accountancy/dashboard" replace />} />
      <Route path="dashboard" element={<AccountancyDashboard />} />
      
      {/* Core Features */}
      <Route path="client-portal" element={<Navigate to="/accountancy/client-management" replace />} />
      <Route path="client-management" element={<ClientManagementPage practiceId={practiceId} />} />
      <Route path="health" element={<PracticeHealth />} />
      <Route path="team/skills-assessment" element={<SkillsAssessmentPage />} />
      <Route path="team/advisory-capability" element={<AdvisoryCapabilityMatrix />} />
      <Route path="team/knowledge-base" element={<KnowledgeBasePage />} />
      {/* team-member routes moved outside AccountancyLayout - see AccountancyRoute component */}
      <Route path="team" element={
        <>
          {console.log('[Route] Team Management page matched')}
          <TeamManagementPage />
        </>
      } />
      <Route path="team-portal/vark-assessment" element={<VARKAssessmentPage />} />
      <Route path="team-portal/mentoring" element={<MentoringHubPage />} />
      <Route path="team-portal/onboarding" element={<OnboardingHubPage />} />
      <Route path="team-portal/onboarding-admin" element={<OnboardingAdminPage />} />
      <Route path="team-portal/analytics" element={<AnalyticsDashboardPage />} />
      <Route path="team-portal/training-recommendations" element={<TrainingRecommendationsPage />} />
      <Route path="team-portal/cpd-skills-impact" element={<CPDSkillsBridgePage />} />
      <Route path="team-portal/mobile-assessment" element={<MobileAssessmentPage />} />
      <Route path="client-rescues" element={<ClientRescues />} />
      <Route path="advisory-services" element={
        <>
          {console.log('[Route] Advisory Services list page matched')}
          <AdvisoryServices />
        </>
      } />
      <Route path="advisory-services/:serviceId" element={
        <>
          {console.log('[Route] Advisory Services detail page matched')}
          <ServiceDetailPage />
        </>
      } />
      
      {/* Advisory Sub-Pages */}
      <Route path="portal/advisory/forecasting" element={<ForecastingPage />} />
      <Route path="portal/advisory/forecasting/:clientId" element={<ForecastingPage />} />
      <Route path="portal/advisory/valuation" element={<ValuationPage />} />
      <Route path="portal/advisory/valuation/:clientId" element={<ValuationPage />} />
      
      {/* New Portal Features */}
      <Route path="portal/client-vault" element={<ClientVaultPage />} />
      <Route path="portal/client-vault/:clientId" element={<ClientVaultPage />} />
      <Route path="portal/systems-audit" element={<SystemsAuditPage />} />
      <Route path="portal/systems-audit/:clientId" element={<SystemsAuditPage />} />
      <Route path="portal/365-alignment" element={<AlignmentProgrammePage />} />
      <Route path="portal/365-alignment/:clientId" element={<AlignmentProgrammePage />} />
      
      {/* Compliance & Regulatory */}
      <Route path="compliance" element={<ComplianceCalendarPage />} />
      <Route path="regulatory-compliance" element={<Navigate to="/accountancy/compliance" replace />} />
      
      {/* Partner Services */}
      <Route path="alternate-auditor" element={<AlternateAuditorPage />} />
      <Route path="mtd-capacity" element={<MTDCapacityPage />} />
      <Route path="esg-reporting" element={<ESGReportingPage />} />
      <Route path="continuity-planning" element={<ContinuityPlanningPage />} />
      <Route path="continuity" element={<Navigate to="/accountancy/continuity-planning" replace />} />
      <Route path="cyber-security" element={<CyberSecurityPage />} />
      <Route path="team-wellness" element={<TeamWellnessPage />} />
      
      {/* Outreach System */}
      <Route path="outreach">
        <Route index element={<OutreachDashboard />} />
        <Route path="campaigns" element={<CampaignPage />} />
        <Route path="campaigns/:id" element={<CampaignPage />} />
        <Route path="contacts" element={<ContactPage />} />
        <Route path="contacts/:id" element={<ContactPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="schedule/:id" element={<SchedulePage />} />
        <Route path="prospects" element={<ProspectList />} />
        <Route path="prospects/:id" element={<ProspectDetail />} />
        <Route path="pe" element={<PEMonitor />} />
        <Route path="pe/:id" element={<PEAcquisitionDetail />} />
        <Route path="research" element={<Research />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>
      
      {/* Complaints */}
      <Route path="complaints">
        <Route index element={<HandoverComplaintsPage />} />
        <Route path="new" element={<NewComplaintPage />} />
        <Route path=":id" element={<ComplaintDetailsPage />} />
      </Route>
      
      {/* KPI & Analytics */}
      <Route path="kpi" element={<KPIDashboardPage />} />
      
      {/* Settings & Management */}
      <Route path="subscription" element={<Navigate to="/accountancy/manage-subscription" replace />} />
      <Route path="manage-subscription" element={<ManageSubscriptionPage />} />
      <Route path="settings" element={<SettingsPage />} />
      
      {/* Catch all - redirect to dashboard */}
      <Route path="*" element={
        <>
          {console.log('[AccountancyRoutes] Catch-all route triggered - redirecting to dashboard')}
          <Navigate to="/accountancy/dashboard" replace />
        </>
      } />
    </Routes>
  );
};

const AccountancyRoute: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/auth" element={
        user ? <Navigate to="/accountancy/dashboard" replace /> : <Navigate to="/auth?portal=accountancy" replace />
      } />
      
      {/* Team Member Portal Routes - WITHOUT Admin Layout */}
      <Route path="/team-member/*" element={
        <ProtectedRoute>
          <Routes>
            <Route path="dashboard" element={
              <>
                {console.log('[Route] Team Member Dashboard matched - viewAs:', new URLSearchParams(window.location.search).get('viewAs'))}
                <TeamMemberDashboard />
              </>
            } />
            <Route path="assignments" element={<MyAssignmentsPage />} />
            <Route path="cpd" element={<CPDSkillsBridgePage />} />
            <Route path="cpd/log" element={<CPDSkillsBridgePage />} />
          </Routes>
        </ProtectedRoute>
      } />
      
      {/* Admin Routes - WITH Admin Layout */}
      <Route path="/*" element={
        <ProtectedRoute>
          <AccountancyLayout>
            <Routes>
              {/* Add the missing practice selection route */}
              <Route path="select-practice" element={<PracticeSelection />} />
              <Route path="/*" element={<AccountancyRoutesWrapper />} />
            </Routes>
          </AccountancyLayout>
        </ProtectedRoute>
      } />
    </Routes>
  );
};

export default AccountancyRoute;