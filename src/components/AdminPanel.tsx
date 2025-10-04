import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { useAuth } from '../contexts/AuthContext';
import { useAccountancyContext } from '../contexts/AccountancyContext';

export const AdminPanel: React.FC = () => {
  const { user, signOut } = useAuth();
  const { practice, loading } = useAccountancyContext();
  const [customUUID, setCustomUUID] = useState('');
  const [customEmail, setCustomEmail] = useState('');

  const handleSetUUID = () => {
    if (customUUID) {
      localStorage.setItem('custom-user-uuid', customUUID);
      localStorage.setItem('custom-user-email', customEmail || 'admin@oracle.com');
      alert('UUID set! Please refresh the page to apply changes.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.reload();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleClearCache = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <Card className="m-4 bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Admin Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">Current User:</p>
          <p className="font-mono text-xs bg-gray-100 p-2 rounded">
            ID: {user?.id}<br/>
            Email: {user?.email}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-2">Practice Status:</p>
          <p className="text-sm">
            {loading ? 'Loading...' : practice ? `Loaded: ${practice.name}` : 'No practice loaded'}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Custom UUID:</label>
          <Input
            value={customUUID}
            onChange={(e) => setCustomUUID(e.target.value)}
            placeholder="Enter your UUID here"
            className="font-mono text-xs"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Custom Email:</label>
          <Input
            value={customEmail}
            onChange={(e) => setCustomEmail(e.target.value)}
            placeholder="Enter your email here"
            className="text-xs"
          />
        </div>

        <div className="flex space-x-2">
          <Button onClick={handleSetUUID} size="sm">
            Set UUID
          </Button>
          <Button onClick={handleSignOut} variant="outline" size="sm">
            Sign Out
          </Button>
          <Button onClick={handleClearCache} variant="destructive" size="sm">
            Clear Cache
          </Button>
        </div>

        <div className="text-xs text-gray-500">
          <p>Instructions:</p>
          <ol className="list-decimal list-inside space-y-1 mt-1">
            <li>Enter your UUID and email above</li>
            <li>Click "Set UUID"</li>
            <li>Refresh the page</li>
            <li>Test the sidebar navigation</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
