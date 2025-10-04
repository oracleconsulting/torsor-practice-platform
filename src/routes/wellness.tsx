import React from 'react';
import { WellnessDashboard } from '@/components/accountancy/dashboard/wellness/WellnessDashboard';
import { useAuth } from '@/hooks/useAuth';

export const WellnessRoute: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <div>Please log in to access the wellness dashboard.</div>;
  }

  return (
    <WellnessDashboard
      teamId={user.teamId}
      staffId={user.id}
    />
  );
}; 