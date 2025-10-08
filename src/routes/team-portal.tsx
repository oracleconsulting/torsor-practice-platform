import { lazy } from 'react';
import { Navigate } from 'react-router-dom';

// Lazy load portal components
const LoginPage = lazy(() => import('@/pages/team-portal/LoginPage'));
const PortalLayout = lazy(() => import('@/pages/team-portal/PortalLayout'));
const DashboardPage = lazy(() => import('@/pages/team-portal/DashboardPage'));
const AssessmentPage = lazy(() => import('@/pages/team-portal/AssessmentPage'));
const ProfilePage = lazy(() => import('@/pages/team-portal/ProfilePage'));
const DevelopmentPage = lazy(() => import('@/pages/team-portal/DevelopmentPage'));
const TeamInsightsPage = lazy(() => import('@/pages/team-portal/TeamInsightsPage'));

/**
 * Team Portal Routes
 * 
 * Standalone portal for team members to:
 * - Complete skills assessments
 * - View their profile
 * - Track development goals
 * - See anonymized team insights
 */
export const teamPortalRoutes = [
  {
    path: '/team-portal/login',
    element: <LoginPage />,
  },
  {
    path: '/team-portal',
    element: <PortalLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/team-portal/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'assessment',
        element: <AssessmentPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'development',
        element: <DevelopmentPage />,
      },
      {
        path: 'team-insights',
        element: <TeamInsightsPage />,
      },
    ],
  },
];

