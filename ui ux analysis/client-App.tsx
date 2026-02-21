import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Eager-loaded (small / auth-critical)
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import InvitationPage from './pages/InvitationPage';
import StaffInterviewPage from './pages/services/StaffInterviewPage';

// Lazy-loaded pages (default exports)
const UnifiedDashboardPage = lazy(() => import('./pages/UnifiedDashboardPage'));
const DiscoveryCompletePage = lazy(() => import('./pages/DiscoveryCompletePage'));
const AssessmentsPage = lazy(() => import('./pages/assessments/AssessmentsPage'));
const AssessmentPart1Page = lazy(() => import('./pages/assessments/Part1Page'));
const AssessmentPart2Page = lazy(() => import('./pages/assessments/Part2Page'));
const AssessmentPart3Page = lazy(() => import('./pages/assessments/Part3Page'));
const AssessmentReviewPage = lazy(() => import('./pages/assessments/ReviewPage'));
const ViewAssessmentAnswersPage = lazy(() => import('./pages/assessments/ViewAssessmentAnswersPage'));
const RoadmapPage = lazy(() => import('./pages/roadmap/RoadmapPage'));
const SprintDashboardPage = lazy(() => import('./pages/SprintDashboardPage'));
const ChatPage = lazy(() => import('./pages/chat/ChatPage'));
const AppointmentsPage = lazy(() => import('./pages/appointments/AppointmentsPage'));
const ServiceAssessmentPage = lazy(() => import('./pages/services/ServiceAssessmentPage'));
const BIReportPage = lazy(() => import('./pages/services/BIReportPage'));
const BIDashboardPage = lazy(() => import('./pages/services/BIDashboardPage'));
const BIPresentationPage = lazy(() => import('./pages/services/BIPresentationPage'));
const SystemInventoryPage = lazy(() => import('./pages/services/SystemInventoryPage'));
const ProcessDeepDivesPage = lazy(() => import('./pages/services/ProcessDeepDivesPage'));
const SAReportPage = lazy(() => import('./pages/services/SAReportPage'));
const BenchmarkingReportPage = lazy(() => import('./pages/services/BenchmarkingReportPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const LifeThreadPage = lazy(() => import('./pages/LifeThreadPage'));
const ProgressPage = lazy(() => import('./pages/ProgressPage'));
const DestinationDiscoveryPage = lazy(() => import('./pages/discovery/DestinationDiscoveryPage'));
const DiscoveryReportPage = lazy(() => import('./pages/discovery/DiscoveryReportPage'));
const DiscoveryFollowUpPage = lazy(() => import('./pages/discovery/DiscoveryFollowUpPage'));

function PageLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-300 border-t-indigo-600 mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/signup/:practiceCode" element={<SignupPage />} />
            <Route path="/invitation/:token" element={<InvitationPage />} />
            <Route path="/staff-interview/:engagementId" element={<StaffInterviewPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<UnifiedDashboardPage />} />
              <Route path="/portal" element={<Navigate to="/dashboard" replace />} />
              <Route path="/assessments" element={<AssessmentsPage />} />
              <Route path="/assessments/view/:serviceCode" element={<ViewAssessmentAnswersPage />} />
              <Route path="/assessment/part1" element={<AssessmentPart1Page />} />
              <Route path="/assessment/part2" element={<AssessmentPart2Page />} />
              <Route path="/assessment/part3" element={<AssessmentPart3Page />} />
              <Route path="/assessment/review" element={<AssessmentReviewPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/roadmap" element={<RoadmapPage />} />
              <Route path="/tasks" element={<SprintDashboardPage />} />
              <Route path="/life" element={<LifeThreadPage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route path="/service/:serviceCode/assessment" element={<ServiceAssessmentPage />} />
              <Route path="/service/business_intelligence/report" element={<BIReportPage />} />
              <Route path="/service/business_intelligence/dashboard" element={<BIDashboardPage />} />
              <Route path="/service/business_intelligence/presentation" element={<BIPresentationPage />} />
              <Route path="/service/management_accounts/report" element={<Navigate to="/service/business_intelligence/report" replace />} />
              <Route path="/service/management_accounts/dashboard" element={<Navigate to="/service/business_intelligence/dashboard" replace />} />
              <Route path="/service/management_accounts/presentation" element={<Navigate to="/service/business_intelligence/presentation" replace />} />
              <Route path="/service/systems_audit/inventory" element={<SystemInventoryPage />} />
              <Route path="/service/systems_audit/process-deep-dives" element={<ProcessDeepDivesPage />} />
              <Route path="/service/systems_audit/report" element={<SAReportPage />} />
              <Route path="/service/benchmarking/report" element={<BenchmarkingReportPage />} />
              <Route path="/discovery" element={<DestinationDiscoveryPage />} />
              <Route path="/discovery/follow-up" element={<DiscoveryFollowUpPage />} />
              <Route path="/discovery/complete" element={<DiscoveryCompletePage />} />
              <Route path="/discovery/report" element={<DiscoveryReportPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
