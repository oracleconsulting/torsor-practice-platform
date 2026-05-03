import { Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { AssessmentReviewPage } from './pages/public/AssessmentReviewPage';
import { PageSkeleton } from './components/ui';
import { AdminLayout } from './components/AdminLayout';
import { RequireStaff } from './components/RequireStaff';
import { ToastProvider } from './components/ui/Toast';
import './lib/export-benchmarking-data';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Lazy-loaded pages (named exports use .then(m => ({ default: m.Name })))
const ClientServicesPage = lazy(() => import('./pages/admin/clients').then(m => ({ default: m.ClientServicesPage })));
const GADashboardPage = lazy(() => import('./pages/admin/GADashboardPage').then(m => ({ default: m.GADashboardPage })));
const GAClientLiveViewPage = lazy(() => import('./pages/admin/GAClientLiveViewPage').then(m => ({ default: m.GAClientLiveViewPage })));
const AgentObservationsPage = lazy(() => import('./pages/admin/AgentObservationsPage').then(m => ({ default: m.AgentObservationsPage })));
const BIPortalPage = lazy(() => import('./pages/admin/BIPortalPage').then(m => ({ default: m.BIPortalPage })));
const DeliveryManagementPage = lazy(() => import('./pages/admin/DeliveryManagementPage').then(m => ({ default: m.DeliveryManagementPage })));
const SkillsHeatmapPage = lazy(() => import('./pages/admin/SkillsHeatmapPage').then(m => ({ default: m.SkillsHeatmapPage })));
const SkillsManagementPage = lazy(() => import('./pages/admin/SkillsManagementPage').then(m => ({ default: m.SkillsManagementPage })));
const TeamAnalyticsPage = lazy(() => import('./pages/admin/TeamAnalyticsPage').then(m => ({ default: m.TeamAnalyticsPage })));
const CPDTrackerPage = lazy(() => import('./pages/admin/CPDTrackerPage').then(m => ({ default: m.CPDTrackerPage })));
const TrainingPlansPage = lazy(() => import('./pages/admin/TrainingPlansPage').then(m => ({ default: m.TrainingPlansPage })));
const ServiceReadinessPage = lazy(() => import('./pages/admin/ServiceReadinessPage').then(m => ({ default: m.ServiceReadinessPage })));
const AssessmentPreviewPage = lazy(() => import('./pages/admin/AssessmentPreviewPage').then(m => ({ default: m.AssessmentPreviewPage })));
const ServiceConfigPage = lazy(() => import('./pages/admin/ServiceConfigPage').then(m => ({ default: m.ServiceConfigPage })));
const ServiceLineBuilderPage = lazy(() => import('./pages/admin/ServiceLineBuilderPage').then(m => ({ default: m.ServiceLineBuilderPage })));
const TechDatabasePage = lazy(() => import('./pages/admin/TechDatabasePage').then(m => ({ default: m.TechDatabasePage })));
const KnowledgeBasePage = lazy(() => import('./pages/admin/KnowledgeBasePage').then(m => ({ default: m.KnowledgeBasePage })));
const StaffPermissionsPage = lazy(() => import('./pages/admin/StaffPermissionsPage').then(m => ({ default: m.StaffPermissionsPage })));
const BIReportsListPage = lazy(() => import('./pages/admin/BIReportsListPage'));
const BIPeriodReportPage = lazy(() => import('./pages/admin/BIPeriodReportPage'));
const BIPerpetualViewPage = lazy(() => import('./pages/admin/BIPerpetualViewPage'));

function PageLoadingFallback() {
  return (
    <AdminLayout title="">
      <PageSkeleton />
    </AdminLayout>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  const isPublicReviewPage =
    window.location.pathname === '/review' ||
    window.location.pathname.startsWith('/review/');

  if (isPublicReviewPage) {
    return <AssessmentReviewPage />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <RequireStaff>
      <Suspense fallback={<PageLoadingFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/clients" replace />} />
          <Route path="/clients" element={<ClientServicesPage />} />
          <Route path="/clients/:clientId/bi/reports" element={<BIReportsListPage />} />
          <Route path="/clients/:clientId/bi/reports/:periodId" element={<BIPeriodReportPage />} />
          <Route path="/clients/:clientId/bi/perpetual" element={<BIPerpetualViewPage />} />
          <Route path="/goal-alignment" element={<GADashboardPage />} />
          <Route path="/goal-alignment/clients/:clientId" element={<GAClientLiveViewPage />} />
          <Route path="/bi-portal" element={<BIPortalPage />} />
          <Route path="/delivery" element={<DeliveryManagementPage />} />
          <Route path="/skills/heatmap" element={<SkillsHeatmapPage />} />
          <Route
            path="/skills/management"
            element={
              <RequireStaff requireOwner>
                <SkillsManagementPage />
              </RequireStaff>
            }
          />
          <Route
            path="/team/analytics"
            element={
              <RequireStaff requireOwner>
                <TeamAnalyticsPage />
              </RequireStaff>
            }
          />
          <Route path="/team/cpd" element={<CPDTrackerPage />} />
          <Route path="/team/training" element={<TrainingPlansPage />} />
          <Route
            path="/team/permissions"
            element={
              <RequireStaff requireOwner>
                <StaffPermissionsPage />
              </RequireStaff>
            }
          />
          <Route path="/practice/readiness" element={<ServiceReadinessPage />} />
          <Route path="/practice/assessments" element={<AssessmentPreviewPage />} />
          <Route path="/practice/agent-observations" element={<AgentObservationsPage />} />
          <Route path="/config/services" element={<ServiceConfigPage />} />
          <Route path="/config/service-builder" element={<ServiceLineBuilderPage />} />
          <Route path="/config/tech-database" element={<TechDatabasePage />} />
          <Route path="/config/knowledge-base" element={<KnowledgeBasePage />} />
          <Route path="*" element={<Navigate to="/clients" replace />} />
        </Routes>
      </Suspense>
    </RequireStaff>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
