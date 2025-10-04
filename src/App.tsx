import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { AccountancyProvider } from './contexts/AccountancyContext';
import { ErrorBoundary } from './components/ErrorBoundary';

// Auth pages
import Auth from './pages/Auth';

// Import routes
import TorsorRoutes from './routes/index';

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      <p className="mt-4 text-gray-300">Loading TORSOR...</p>
    </div>
  </div>
);

// Main App Component
function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AccountancyProvider>
            <Routes>
              {/* Auth Route */}
              <Route path="/auth" element={<Auth />} />
              
              {/* Main App Routes */}
              <Route path="/*" element={<TorsorRoutes />} />
              
              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            <Toaster position="top-right" />
          </AccountancyProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
