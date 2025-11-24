import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { SkillsHeatmapPage } from './pages/admin/SkillsHeatmapPage';
import { SkillsManagementPage } from './pages/admin/SkillsManagementPage';
import { ServiceReadinessPage } from './pages/admin/ServiceReadinessPage';
import { TeamAnalyticsPage } from './pages/admin/TeamAnalyticsPage';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

type Page = 'heatmap' | 'management' | 'readiness' | 'analytics';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('management'); // Default to management page

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
