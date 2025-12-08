import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import InvitationPage from './pages/InvitationPage';
import DashboardPage from './pages/DashboardPage';
import DiscoveryPortalPage from './pages/DiscoveryPortalPage';
import DiscoveryCompletePage from './pages/DiscoveryCompletePage';
import AssessmentsPage from './pages/assessments/AssessmentsPage';
import AssessmentPart1Page from './pages/assessments/Part1Page';
import AssessmentPart2Page from './pages/assessments/Part2Page';
import AssessmentPart3Page from './pages/assessments/Part3Page';
import AssessmentReviewPage from './pages/assessments/ReviewPage';
import RoadmapPage from './pages/roadmap/RoadmapPage';
import TasksPage from './pages/roadmap/TasksPage';
import ChatPage from './pages/chat/ChatPage';
import AppointmentsPage from './pages/appointments/AppointmentsPage';
import ServiceAssessmentPage from './pages/services/ServiceAssessmentPage';
import DestinationDiscoveryPage from './pages/discovery/DestinationDiscoveryPage';
import DiscoveryReportPage from './pages/discovery/DiscoveryReportPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/signup/:practiceCode" element={<SignupPage />} />
          <Route path="/invitation/:token" element={<InvitationPage />} />
          
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            {/* Default: Discovery Portal (simple view) */}
            <Route path="/" element={<Navigate to="/portal" replace />} />
            <Route path="/portal" element={<DiscoveryPortalPage />} />
            
            {/* Legacy dashboard for 365 clients */}
            <Route path="/dashboard" element={<DashboardPage />} />
            
            {/* Assessments */}
            <Route path="/assessments" element={<AssessmentsPage />} />
            <Route path="/assessment/part1" element={<AssessmentPart1Page />} />
            <Route path="/assessment/part2" element={<AssessmentPart2Page />} />
            <Route path="/assessment/part3" element={<AssessmentPart3Page />} />
            <Route path="/assessment/review" element={<AssessmentReviewPage />} />
            
            {/* Roadmap & Tasks */}
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            
            {/* Chat */}
            <Route path="/chat" element={<ChatPage />} />
            
            {/* Appointments */}
            <Route path="/appointments" element={<AppointmentsPage />} />
            
            {/* Service Line Assessments */}
            <Route path="/service/:serviceCode/assessment" element={<ServiceAssessmentPage />} />
            
            {/* Destination Discovery Assessment */}
            <Route path="/discovery" element={<DestinationDiscoveryPage />} />
            <Route path="/discovery/complete" element={<DiscoveryCompletePage />} />
            <Route path="/discovery/report" element={<DiscoveryReportPage />} />
          </Route>
          
          {/* Catch all - go to portal */}
          <Route path="*" element={<Navigate to="/portal" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
