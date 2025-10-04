import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoutes';
import AccountancyLayout from '../components/accountancy/layout/AccountancyLayout';
import { useAuth } from '../contexts/AuthContext';
import { useAccountancyContext } from '../contexts/AccountancyContext';

// Import all page components
import AccountancyDashboard from '../pages/AccountancyDashboard';
import { ClientManagementPage } from '../components/accountancy/client-management/ClientManagementPage';
import TeamManagementPage from '../pages/TeamManagementPage';
import { AlternateAuditorPage } from '../pages/AlternateAuditorPage';
import { MTDCapacityPage } from '../pages/MTDCapacityPage';
import { ESGReportingPage } from '../pages/ESGReportingPage';
import { ContinuityPlanningPage } from '../pages/ContinuityPlanningPage';
import CyberSecurityPage from '../pages/CyberSecurityPage';
import TeamWellnessPage from '../pages/TeamWellnessPage';
import ManageSubscriptionPage from '../pages/ManageSubscriptionPage';
import ComplianceCalendarPage from '../pages/ComplianceCalendarPage';
import { HandoverComplaintsPage } from '../pages/HandoverComplaintsPage';
import { NewComplaintPage } from '../pages/NewComplaintPage';
import { ComplaintDetailsPage } from '../pages/ComplaintDetailsPage';
import KPIDashboardPage from '../pages/KPIDashboardPage';
import SettingsPage from '../pages/SettingsPage';

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
import ClientRescues from '../pages/ClientRescues';
import AdvisoryServices from '../pages/AdvisoryServices';
import ServiceDetailPage from '../pages/ServiceDetailPage';
import PracticeHealth from '../pages/PracticeHealth';
import ClientVaultPage from '../pages/ClientVaultPage';
import SystemsAuditPage from '../pages/SystemsAuditPage';
import AlignmentProgrammePage from '../pages/AlignmentProgrammePage';

// Advisory sub-pages
import ForecastingPage from '../pages/advisory/ForecastingPage';
import ValuationPage from '../pages/advisory/ValuationPage';

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
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="dashboard" element={<AccountancyDashboard />} />
      
      {/* Core Features */}
      <Route path="client-portal" element={<Navigate to="/client-management" replace />} />
      <Route path="client-management" element={<ClientManagementPage practiceId={practiceId} />} />
      <Route path="health" element={<PracticeHealth />} />
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
      <Route path="/auth" element={
        user ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth?portal=torsor" replace />
      } />
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