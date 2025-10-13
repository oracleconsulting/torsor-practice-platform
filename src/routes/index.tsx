import React, { lazy, Suspense } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoutes';
import AccountancyLayout from '../components/accountancy/layout/AccountancyLayout';
import { useAuth } from '../contexts/AuthContext';
import { useAccountancyContext } from '../contexts/AccountancyContext';

// Lazy load team portal pages
const TeamPortalLogin = lazy(() => import('../pages/team-portal/LoginPage'));
const TeamPortalLayout = lazy(() => import('../pages/team-portal/PortalLayout'));
const TeamPortalDashboard = lazy(() => import('../pages/team-portal/DashboardPage'));
const TeamPortalAssessment = lazy(() => import('../pages/team-portal/AssessmentPage'));
const PublicAssessment = lazy(() => import('../pages/team-portal/PublicAssessmentPage'));

// Eager load AssessmentComplete to prevent "Failed to fetch module" errors
// This is a critical page at the end of the assessment flow
import AssessmentComplete from '../pages/team-portal/AssessmentCompletePage';

// Import all page components
import AccountancyDashboard from '../pages/AccountancyDashboard';
import { ClientManagementPage } from '../components/accountancy/client-management/ClientManagementPage';
import TeamManagementPage from '../pages/accountancy/TeamManagementPage';
import SkillsAssessmentPage from '../pages/accountancy/team/SkillsAssessmentPage';
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
import SavedProspectsPage from '../components/accountancy/outreach/SavedProspectsPage';

// Import new page components
import ClientRescues from '../pages/accountancy/ClientRescues';
import AdvisoryServices from '../pages/accountancy/AdvisoryServices';
import ServiceDetailPage from '../pages/ServiceDetailPage';
import PracticeHealth from '../pages/accountancy/PracticeHealth';
import ClientVaultPage from '../pages/accountancy/ClientVaultPage';
import SystemsAuditPage from '../pages/accountancy/SystemsAuditPage';
import AlignmentProgrammePage from '../pages/accountancy/AlignmentProgrammePage';
import VARKAssessmentPage from '../pages/accountancy/team/VARKAssessmentPage';

// Advisory sub-pages
import ForecastingPage from '../pages/accountancy/advisory/ForecastingPage';
import ValuationPage from '../pages/accountancy/advisory/ValuationPage';

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
    return <Navigate to="/select-practice" replace />;
  }

  return (
    <Routes>
      <Route index element={<Navigate to="/team" replace />} />
      <Route path="dashboard" element={<AccountancyDashboard />} />
      
      {/* Core Features */}
      <Route path="client-portal" element={<Navigate to="/client-management" replace />} />
      <Route path="client-management" element={<ClientManagementPage practiceId={practiceId} />} />
      <Route path="health" element={<PracticeHealth />} />
      <Route path="team/skills-assessment" element={<SkillsAssessmentPage />} />
      <Route path="team-portal/vark-assessment" element={<VARKAssessmentPage />} />
      <Route path="team" element={<TeamManagementPage />} />
      <Route path="client-rescues" element={<ClientRescues />} />
      <Route path="advisory-services" element={<AdvisoryServices />} />
      <Route path="advisory-services/:serviceId" element={<ServiceDetailPage />} />
      
      {/* Advisory Sub-Pages */}
      <Route path="advisory/forecasting" element={<ForecastingPage />} />
      <Route path="advisory/forecasting/:clientId" element={<ForecastingPage />} />
      <Route path="advisory/valuation" element={<ValuationPage />} />
      <Route path="advisory/valuation/:clientId" element={<ValuationPage />} />
      
      {/* Portal Features */}
      <Route path="client-vault" element={<ClientVaultPage />} />
      <Route path="client-vault/:clientId" element={<ClientVaultPage />} />
      <Route path="systems-audit" element={<SystemsAuditPage />} />
      <Route path="systems-audit/:clientId" element={<SystemsAuditPage />} />
      <Route path="365-alignment" element={<AlignmentProgrammePage />} />
      <Route path="365-alignment/:clientId" element={<AlignmentProgrammePage />} />
      
      {/* Compliance & Regulatory */}
      <Route path="compliance" element={<ComplianceCalendarPage />} />
      <Route path="regulatory-compliance" element={<Navigate to="/compliance" replace />} />
      
      {/* Partner Services */}
      <Route path="alternate-auditor" element={<AlternateAuditorPage />} />
      <Route path="mtd-capacity" element={<MTDCapacityPage />} />
      <Route path="esg-reporting" element={<ESGReportingPage />} />
      <Route path="continuity-planning" element={<ContinuityPlanningPage />} />
      <Route path="continuity" element={<Navigate to="/continuity-planning" replace />} />
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
        <Route path="saved-prospects" element={<SavedProspectsPage />} />
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
      <Route path="subscription" element={<Navigate to="/manage-subscription" replace />} />
      <Route path="manage-subscription" element={<ManageSubscriptionPage />} />
      <Route path="settings" element={<SettingsPage />} />
      
      {/* Catch all - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const TorsorRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes - No authentication required */}
      <Route path="/auth" element={
        user ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth?portal=torsor" replace />
      } />
      
      {/* Team Portal - Public Assessment (No Auth Required) */}
      <Route path="/team-portal/assessment-public" element={
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>}>
          <PublicAssessment />
        </Suspense>
      } />
      
      {/* Team Portal - Assessment Complete (eager loaded to prevent module fetch errors) */}
      <Route path="/team-portal/assessment-complete" element={<AssessmentComplete />} />
      
      {/* Team Portal - Public login (for future use) */}
      <Route path="/team-portal/login" element={
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>}>
          <TeamPortalLogin />
        </Suspense>
      } />
      
      {/* Team Portal - Protected routes (for future use) */}
      <Route path="/team-portal/*" element={
        <ProtectedRoute>
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>}>
            <Routes>
              <Route path="dashboard" element={<TeamPortalDashboard />} />
              <Route path="assessment" element={<TeamPortalAssessment />} />
              <Route path="*" element={<Navigate to="/team-portal/dashboard" replace />} />
            </Routes>
          </Suspense>
        </ProtectedRoute>
      } />
      
      {/* Accountancy Portal - Protected routes */}
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

export default TorsorRoutes;