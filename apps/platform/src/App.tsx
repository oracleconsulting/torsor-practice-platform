import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import ClientsPage from '@/pages/ClientsPage';
import ClientDetailPage from '@/pages/ClientDetailPage';
import MAPreCallPage from '@/pages/clients/MAPreCallPage';
import RoadmapReviewPage from '@/pages/clients/RoadmapReviewPage';
import { Loader2 } from 'lucide-react';

function AppRoutes() {
  const { user, teamMember, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
          <p className="text-slate-500 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (!teamMember) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🚫</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2 font-display">Access Denied</h1>
          <p className="text-slate-600 mb-6">
            This account doesn't have access to the practice platform.
            If you're a client, please use the client portal instead.
          </p>
          <div className="space-y-3">
            <a
              href="https://client.torsor.co.uk"
              className="block w-full py-2.5 px-4 btn-primary text-center"
            >
              Go to Client Portal
            </a>
            <button
              onClick={() => window.location.reload()}
              className="block w-full py-2.5 px-4 btn-secondary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/clients" element={<ClientsPage />} />
      <Route path="/clients/:clientId" element={<ClientDetailPage />} />
      <Route path="/clients/:clientId/ma-precall" element={<MAPreCallPage />} />
      <Route path="/clients/:clientId/roadmap-review" element={<RoadmapReviewPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
