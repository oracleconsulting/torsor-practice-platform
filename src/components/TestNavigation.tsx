import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';

export const TestNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const testRoutes = [
    { label: 'Dashboard', path: '/accountancy/dashboard' },
    { label: 'Client Management', path: '/accountancy/client-management' },
    { label: 'Health Score', path: '/accountancy/health' },
    { label: 'Team Management', path: '/accountancy/team' },
    { label: 'Advisory Services', path: '/accountancy/advisory-services' },
  ];

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg m-4">
      <h2 className="text-xl font-bold mb-4">Navigation Test</h2>
      <p className="mb-4">Current path: <code>{location.pathname}</code></p>
      <div className="space-y-2">
        {testRoutes.map((route) => (
          <Button
            key={route.path}
            onClick={() => {
              console.log('Navigating to:', route.path);
              navigate(route.path);
            }}
            className="w-full justify-start"
          >
            {route.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
