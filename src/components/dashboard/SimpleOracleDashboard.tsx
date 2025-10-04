import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const SimpleOracleDashboard = () => {
  const { user } = useAuth();
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Oracle Dashboard</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Logged in as: {user?.email || 'Not logged in'}</p>
          <p className="mt-4 text-gray-600">
            This is a simplified version to test if routing works.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleOracleDashboard;