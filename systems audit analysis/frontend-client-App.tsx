import { Component, Suspense, lazy, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Eager-loaded (small / auth-critical)
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import InvitationPage from './pages/InvitationPage';
import StaffInterviewPage from './pages/services/StaffInterviewPage';
import UnifiedDashboardPage from './pages/UnifiedDashboardPage';
import BenchmarkingReportPage from './pages/services/BenchmarkingReportPage';

// Dashboard and benchmarking are critical navigation routes; keep them in the
// main bundle to avoid stale dynamic chunk failures during client-facing deploys.
// Lazy-loaded pages (default exports)
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
const BIReportsListPage = lazy(() => import('./pages/services/BIReportsListPage'));
const BIPeriodReportPage = lazy(() => import('./pages/services/BIPeriodReportPage'));
const BIPerpetualViewPage = lazy(() => import('./pages/services/BIPerpetualViewPage'));
const BIPresentationPage = lazy(() => import('./pages/services/BIPresentationPage'));
const SystemInventoryPage = lazy(() => import('./pages/services/SystemInventoryPage'));
const ProcessDeepDivesPage = lazy(() => import('./pages/services/ProcessDeepDivesPage'));
const SAReportPage = lazy(() => import('./pages/services/SAReportPage'));
const ReviewSubmitPage = lazy(() => import('./pages/services/ReviewSubmitPage'));
const SubmissionStatusPage = lazy(() => import('./pages/services/SubmissionStatusPage'));
const BenchmarkingReportClassicPage = lazy(() => import('./pages/services/BenchmarkingReportClassicPage'));
const BenchmarkingReportPreviewPage = lazy(() => import('./pages/services/BenchmarkingReportPreviewPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const LifeThreadPage = lazy(() => import('./pages/LifeThreadPage'));
const ProgressPage = lazy(() => import('./pages/ProgressPage'));
const DestinationDiscoveryPage = lazy(() => import('./pages/discovery/DestinationDiscoveryPage'));
const DiscoveryReportPage = lazy(() => import('./pages/discovery/DiscoveryReportPage'));
const DiscoveryFollowUpPage = lazy(() => import('./pages/discovery/DiscoveryFollowUpPage'));

/** Legacy `management_accounts` and hyphenated `/services/...` URLs → canonical BI routes. */
function RedirectManagementAccountsReports() {
  const { periodId } = useParams<{ periodId?: string }>();
  if (periodId) return <Navigate to={`/service/business_intelligence/reports/${periodId}`} replace />;
  return <Navigate to="/service/business_intelligence/reports" replace />;
}

function RedirectServicesHyphenBiReport() {
  const { periodId } = useParams<{ periodId: string }>();
  return <Navigate to={`/service/business_intelligence/reports/${periodId}`} replace />;
}

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

class RouteErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;

    const isChunkError =
      this.state.error.message.includes('dynamically imported module') ||
      this.state.error.message.includes('Importing a module script failed') ||
      this.state.error.message.includes('Failed to fetch');

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900 mb-2">
            {isChunkError ? 'Update required' : 'Something went wrong'}
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            {isChunkError
              ? 'The portal has been updated while this session was open. Reload once to get the latest report files.'
              : 'Please reload the portal and try again.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Reload portal
          </button>
        </div>
      </div>
    );
  }
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <RouteErrorBoundary>
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
              <Route path="/service/business_intelligence/reports" element={<BIReportsListPage />} />
              <Route path="/service/business_intelligence/reports/:periodId" element={<BIPeriodReportPage />} />
              <Route path="/service/business_intelligence/perpetual" element={<BIPerpetualViewPage />} />
              <Route path="/service/business_intelligence/presentation" element={<BIPresentationPage />} />
              <Route path="/services/business-intelligence/reports" element={<Navigate to="/service/business_intelligence/reports" replace />} />
              <Route path="/services/business-intelligence/reports/:periodId" element={<RedirectServicesHyphenBiReport />} />
              <Route path="/services/business-intelligence/perpetual" element={<Navigate to="/service/business_intelligence/perpetual" replace />} />
              <Route path="/service/management_accounts/report" element={<Navigate to="/service/business_intelligence/report" replace />} />
              <Route path="/service/management_accounts/dashboard" element={<Navigate to="/service/business_intelligence/dashboard" replace />} />
              <Route path="/service/management_accounts/reports" element={<RedirectManagementAccountsReports />} />
              <Route path="/service/management_accounts/reports/:periodId" element={<RedirectManagementAccountsReports />} />
              <Route path="/service/management_accounts/perpetual" element={<Navigate to="/service/business_intelligence/perpetual" replace />} />
              <Route path="/service/management_accounts/presentation" element={<Navigate to="/service/business_intelligence/presentation" replace />} />
              <Route path="/service/systems_audit/inventory" element={<SystemInventoryPage />} />
              <Route path="/service/systems_audit/process-deep-dives" element={<ProcessDeepDivesPage />} />
              <Route path="/service/systems_audit/review" element={<ReviewSubmitPage />} />
              <Route path="/service/systems_audit/status" element={<SubmissionStatusPage />} />
              <Route path="/service/systems_audit/report" element={<SAReportPage />} />
              <Route path="/service/benchmarking/report" element={<BenchmarkingReportPage />} />
              <Route path="/service/benchmarking/report/classic" element={<BenchmarkingReportClassicPage />} />
              <Route path="/service/benchmarking/report/preview" element={<BenchmarkingReportPreviewPage />} />
              <Route path="/service/benchmarking/hva" element={<AssessmentPart3Page />} />
              <Route path="/discovery" element={<DestinationDiscoveryPage />} />
              <Route path="/discovery/follow-up" element={<DiscoveryFollowUpPage />} />
              <Route path="/discovery/complete" element={<DiscoveryCompletePage />} />
              <Route path="/discovery/report" element={<DiscoveryReportPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </RouteErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
