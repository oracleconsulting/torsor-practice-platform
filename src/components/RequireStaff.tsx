import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCurrentMember } from '../hooks/useCurrentMember';

interface RequireStaffProps {
  children: React.ReactNode;
  requireOwner?: boolean;
  fallbackMessage?: string;
}

export function RequireStaff({
  children,
  requireOwner = false,
  fallbackMessage,
}: RequireStaffProps) {
  const { user, loading: authLoading } = useAuth();
  const { data: member, isLoading: memberLoading } = useCurrentMember(user?.id);

  if (authLoading || memberLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isStaff = member?.member_type === 'team';
  if (!isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">Access denied</h1>
          <p className="text-gray-600 mb-6">
            {fallbackMessage ?? 'This area is for practice staff only. If you believe this is a mistake, contact your practice administrator.'}
          </p>
          <a href="/" className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Return home
          </a>
        </div>
      </div>
    );
  }

  if (requireOwner) {
    const isOwner = member?.role === 'owner' || member?.role === 'admin';
    if (!isOwner) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-3">Owner access required</h1>
            <p className="text-gray-600">This page is restricted to practice owners and admins.</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
