import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Users, Briefcase } from 'lucide-react';

export default function PortalSelector() {
  const navigate = useNavigate();
  const { user, hasPortalAccess } = useAuth();

  const handlePortalClick = (portal: any) => {
    if (portal.customHandler) {
      portal.customHandler();
    } else if (portal.requiresAuth && !user) {
      // If portal requires auth and user is not logged in, go to auth with portal param
      navigate(`/auth?portal=${portal.id}`);
    } else if (portal.path) {
      navigate(portal.path);
    }
  };

  const portals = [
    {
      id: 'oracle',
      name: 'Oracle Method',
      description: 'AI-powered business transformation',
      icon: Briefcase,
      path: user ? '/dashboard' : null,
      requiresAuth: true,
      color: 'purple',
      hasAccess: true, // Everyone can access Oracle
      customHandler: user ? null : () => navigate('/auth?portal=oracle&redirect=assessment')
    },
    {
      id: 'accountancy',
      name: 'Accountancy Portal',
      description: 'Practice management for accountants',
      icon: Building2,
      path: user && hasPortalAccess('accountancy') ? '/accountancy/dashboard' : null,
      requiresAuth: true,
      color: 'blue',
      hasAccess: user ? hasPortalAccess('accountancy') : true // Show as accessible if not logged in
    },
    {
      id: 'client',
      name: 'Client Portal',
      description: 'Access your accountant services',
      icon: Users,
      path: user && hasPortalAccess('client') ? '/client-portal/dashboard' : null,
      requiresAuth: true,
      color: 'green',
      hasAccess: user ? hasPortalAccess('client') : true // Show as accessible if not logged in
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Oracle Method</h1>
          <p className="text-xl text-gray-600">Choose your portal to continue</p>
          {user && (
            <p className="text-sm text-gray-500 mt-2">
              Logged in as: {user.email}
            </p>
          )}
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {portals.map((portal) => (
            <button
              key={portal.id}
              onClick={() => handlePortalClick(portal)}
              className={`
                bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all
                border-2 border-transparent hover:border-${portal.color}-500
                ${user && !portal.hasAccess ? 'opacity-50 cursor-not-allowed' : ''}
                group
              `}
              disabled={user && !portal.hasAccess}
            >
              <portal.icon className={`w-12 h-12 text-${portal.color}-600 mx-auto mb-4 group-hover:scale-110 transition-transform`} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{portal.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{portal.description}</p>
              
              {user && !portal.hasAccess && (
                <p className="text-xs text-red-600">You don't have access to this portal</p>
              )}
              
              {!user && portal.requiresAuth && (
                <p className="text-xs text-gray-500">Sign in required</p>
              )}
              
              {user && portal.hasAccess && (
                <p className="text-xs text-green-600">Click to enter</p>
              )}
            </button>
          ))}
        </div>
        
        {user && (
          <div className="mt-8 text-center">
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/auth';
              }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}