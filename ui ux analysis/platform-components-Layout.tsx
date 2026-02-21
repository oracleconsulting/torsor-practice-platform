import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  LayoutDashboard, 
  Settings, 
  LogOut,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function Layout({ children, title, subtitle, breadcrumbs }: LayoutProps) {
  const { teamMember, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Clients', href: '/clients', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-[#1a2332] transform transition-transform lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-6 border-b border-[#243044]">
          <div>
            <h1 className="text-xl font-bold text-white font-display tracking-tight">Torsor</h1>
            <p className="text-sm text-slate-400">{teamMember?.practiceName}</p>
          </div>
          <button 
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = currentPath === item.href || 
              (item.href !== '/' && currentPath.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-[#4a90d9]/15 text-[#6bb3f0]' 
                    : 'text-slate-400 hover:bg-[#243044] hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#243044]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#4a90d9] flex items-center justify-center text-white font-semibold">
              {teamMember?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{teamMember?.name}</p>
              <p className="text-xs text-slate-400 truncate">{teamMember?.email}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 w-full px-4 py-2 text-slate-400 hover:text-white hover:bg-[#243044] rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
          <div className="flex items-center gap-4 px-6 py-4">
            <button 
              className="lg:hidden text-slate-600 hover:text-slate-900"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>

            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="flex items-center gap-2 text-sm">
                {breadcrumbs.map((crumb, i) => (
                  <span key={i} className="flex items-center gap-2">
                    {i > 0 && <ChevronRight className="w-4 h-4 text-slate-400" />}
                    {crumb.href ? (
                      <Link to={crumb.href} className="text-slate-500 hover:text-slate-900">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-slate-900 font-medium">{crumb.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {(title || subtitle) && (
            <div className="mb-8">
              {title && <h1 className="text-2xl font-bold text-slate-900 font-display">{title}</h1>}
              {subtitle && <p className="text-slate-600 mt-1">{subtitle}</p>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

