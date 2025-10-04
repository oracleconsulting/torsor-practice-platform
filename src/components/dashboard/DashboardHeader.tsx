
import React from 'react';
import { Button } from '@/components/ui/button';
import { User } from '@supabase/supabase-js';
import { LogOut } from 'lucide-react';
import DynamicHeader from '@/components/layout/DynamicHeader';

interface DashboardHeaderProps {
  user?: User | null;
  onSignOut?: () => void;
}

export const DashboardHeader = ({ user, onSignOut }: DashboardHeaderProps) => {
  // Extract first name from email or user metadata
  const firstName = user?.user_metadata?.first_name || 
                   user?.email?.split('@')[0]?.split('.')[0] || 
                   'Founder';

  const handleSignOut = async () => {
    try {
      if (onSignOut) {
        await onSignOut();
      }
      // Force redirect to home page after sign out
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if there's an error, redirect to home
      window.location.href = '/';
    }
  };

  return (
    <>
      {/* Main site navigation header */}
      <DynamicHeader />
      
      {/* Dashboard-specific header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 mt-16 md:mt-20">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-oracle-gold">
              Welcome back, {firstName.charAt(0).toUpperCase() + firstName.slice(1)}!
            </h1>
            <p className="text-sm text-gray-600">Your personal business transformation dashboard</p>
          </div>
          {user && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user.email}</span>
              <Button variant="outline" onClick={handleSignOut} className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </header>
    </>
  );
};
