import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
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
import { AssessmentReviewPage } from './pages/public/AssessmentReviewPage';
import MAInsightsPage from './pages/management-accounts/MAInsightsPage';
import MAManagementPage from './pages/management-accounts/MAManagementPage';
import type { Page } from './types/navigation';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('management'); // Default to management page

  // Check if this is a public review page (no auth required)
  const isPublicReviewPage = window.location.pathname === '/review' || 
                              window.location.pathname.startsWith('/review/');

  // Public review page - no auth required
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

  // Pass navigation props to each page
  const navProps = {
    onNavigate: setCurrentPage,
    currentPage,
  };

  if (currentPage === 'clients') {
    return <ClientServicesPage {...navProps} />;
  }

  if (currentPage === 'assessments') {
    return <AssessmentPreviewPage {...navProps} />;
  }

  if (currentPage === 'delivery') {
    return <DeliveryManagementPage {...navProps} />;
  }

  if (currentPage === 'config') {
    return <ServiceConfigPage {...navProps} />;
  }

  if (currentPage === 'cpd') {
    return <CPDTrackerPage {...navProps} />;
  }

  if (currentPage === 'training') {
    return <TrainingPlansPage {...navProps} />;
  }

  if (currentPage === 'knowledge') {
    return <KnowledgeBasePage {...navProps} />;
  }

  if (currentPage === 'ma-insights') {
    return <MAInsightsPage {...navProps} />;
  }

  if (currentPage === 'ma-management') {
    return <MAManagementPage {...navProps} />;
  }

  if (currentPage === 'management') {
    return <SkillsManagementPage {...navProps} />;
  }
  
  if (currentPage === 'readiness') {
    return <ServiceReadinessPage {...navProps} />;
  }

  if (currentPage === 'analytics') {
    return <TeamAnalyticsPage {...navProps} />;
  }

  return <SkillsHeatmapPage {...navProps} />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
