import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { SkillsHeatmapPage } from './pages/admin/SkillsHeatmapPage';
import { SkillsManagementPage } from './pages/admin/SkillsManagementPage';
import { ServiceReadinessPage } from './pages/admin/ServiceReadinessPage';
import { TeamAnalyticsPage } from './pages/admin/TeamAnalyticsPage';
import { ClientServicesPage } from './pages/admin/ClientServicesPage';
import { AssessmentPreviewPage } from './pages/admin/AssessmentPreviewPage';
import { DeliveryManagementPage } from './pages/admin/DeliveryManagementPage';
import { ServiceConfigPage } from './pages/admin/ServiceConfigPage';
import { CPDTrackerPage } from './pages/admin/CPDTrackerPage';
import { TrainingPlansPage } from './pages/admin/TrainingPlansPage';
import { KnowledgeBasePage } from './pages/admin/KnowledgeBasePage';
import { MAPortalPage } from './pages/admin/MAPortalPage';
import { ServiceLineBuilderPage } from './pages/admin/ServiceLineBuilderPage';
import { TechDatabasePage } from './pages/admin/TechDatabasePage';
import { GADashboardPage } from './pages/admin/GADashboardPage';
import { AssessmentReviewPage } from './pages/public/AssessmentReviewPage';
// Load debug utilities into window for console access
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

function AppRoutes() {
  const { user, loading } = useAuth();

  // Public review page — no auth required
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
    <Routes>
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/clients" replace />} />

      {/* CLIENT section */}
      <Route path="/clients" element={<ClientServicesPage />} />
      <Route path="/goal-alignment" element={<GADashboardPage />} />
      <Route path="/bi-portal" element={<MAPortalPage />} />
      <Route path="/delivery" element={<DeliveryManagementPage />} />

      {/* TEAM section */}
      <Route path="/skills/heatmap" element={<SkillsHeatmapPage />} />
      <Route path="/skills/management" element={<SkillsManagementPage />} />
      <Route path="/team/analytics" element={<TeamAnalyticsPage />} />
      <Route path="/team/cpd" element={<CPDTrackerPage />} />
      <Route path="/team/training" element={<TrainingPlansPage />} />

      {/* PRACTICE section */}
      <Route path="/practice/readiness" element={<ServiceReadinessPage />} />
      <Route path="/practice/assessments" element={<AssessmentPreviewPage />} />

      {/* CONFIGURATION section */}
      <Route path="/config/services" element={<ServiceConfigPage />} />
      <Route path="/config/service-builder" element={<ServiceLineBuilderPage />} />
      <Route path="/config/tech-database" element={<TechDatabasePage />} />
      <Route path="/config/knowledge-base" element={<KnowledgeBasePage />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/clients" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
