import type { ReactNode } from 'react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Navigation } from './Navigation';
import { useAuth } from '../hooks/useAuth';
import { useCurrentMember } from '../hooks/useCurrentMember';
import { LogOut, Menu, X } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  headerActions?: ReactNode;
}

export function AdminLayout({
  children,
  title,
  subtitle,
  headerActions,
}: AdminLayoutProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Navigation />
      </div>

      {/* Mobile header */}
      <div className="lg:hidden sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between h-14 px-4">
          <span className="text-lg font-bold text-gray-900">Torsor</span>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="border-t border-gray-200 bg-white">
            <Navigation mobile onMobileClose={() => setMobileMenuOpen(false)} />
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="lg:pl-[240px]">
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
              {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-3">
              {headerActions}
              <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{currentMember?.name || 'Loading...'}</p>
                  <p className="text-xs text-gray-500">{currentMember?.role || ''}</p>
                </div>
                <button
                  onClick={() => signOut()}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </header>
        <main className="p-6 page-enter" key={location.pathname}>{children}</main>
      </div>
    </div>
  );
}
