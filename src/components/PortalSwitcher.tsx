import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PORTAL_REQUIRED_ROLES, PortalType } from '../constants/roles';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Building2, Briefcase, Users } from 'lucide-react';

export const PortalSwitcher: React.FC = () => {
  const { userRoles, canAccessPortal } = useAuth();
  const navigate = useNavigate();
  
  // Count how many portals user can access
  const accessiblePortals = Object.keys(PORTAL_REQUIRED_ROLES).filter(portal => 
    canAccessPortal(portal as PortalType)
  );
  
  // Only show switcher if user has access to multiple portals
  if (accessiblePortals.length <= 1) return null;

  const getPortalIcon = (portal: string) => {
    switch (portal) {
      case 'oracle':
        return <Building2 className="w-5 h-5" />;
      case 'accountancy':
        return <Briefcase className="w-5 h-5" />;
      case 'client':
        return <Users className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getPortalName = (portal: string) => {
    switch (portal) {
      case 'oracle':
        return 'Oracle Portal';
      case 'accountancy':
        return 'Accountancy Portal';
      case 'client':
        return 'Client Portal';
      default:
        return portal;
    }
  };

  const getPortalPath = (portal: string) => {
    switch (portal) {
      case 'oracle':
        return '/dashboard';
      case 'accountancy':
        return '/accountancy/dashboard';
      case 'client':
        return '/client-portal/dashboard';
      default:
        return '/';
    }
  };
  
  return (
    <Card className="p-4 shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Switch Portal</h3>
      <div className="space-y-2">
        {accessiblePortals.map((portal) => (
          <Button
            key={portal}
            onClick={() => navigate(getPortalPath(portal))}
            variant="outline"
            className="w-full flex items-center gap-2 justify-start"
          >
            {getPortalIcon(portal)}
            <span>{getPortalName(portal)}</span>
          </Button>
        ))}
      </div>
    </Card>
  );
}; 