import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import {
  Home,
  ClipboardList,
  Map,
  CheckSquare,
  MessageCircle,
  Calendar,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Assessments', href: '/assessments', icon: ClipboardList },
  { name: 'Roadmap', href: '/roadmap', icon: Map },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Chat', href: '/chat', icon: MessageCircle },
  { name: 'Appointments', href: '/appointments', icon: Calendar },
];

export function Layout({ children, title, subtitle }: LayoutProps) {
  const { clientSession, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-slate-200">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-slate-200">
            <Logo className="h-8" />
          </div>

          {/* Client Info */}
          <div className="px-4 py-4 border-b border-slate-200">
            <p className="text-sm font-medium text-slate-900 truncate">
              {clientSession?.name}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {clientSession?.company}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigation.map((item) => {
              // Special case for assessments - match both /assessments and /assessment/*
              const isActive = item.href === '/assessments' 
                ? location.pathname.startsWith('/assessment')
                : location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Sign Out */}
          <div className="p-4 border-t border-slate-200">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">365</span>
            </div>
            <span className="font-semibold text-slate-900">Alignment</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="bg-white border-t border-slate-200 py-2">
            {navigation.map((item) => {
              const isActive = item.href === '/assessments' 
                ? location.pathname.startsWith('/assessment')
                : location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-slate-600'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </Link>
              );
            })}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-slate-600"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="lg:pl-64">
        {/* Page Header */}
        {(title || subtitle) && (
          <header className="bg-white border-b border-slate-200 px-4 lg:px-8 py-6">
            {title && (
              <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            )}
            {subtitle && (
              <p className="text-slate-600 mt-1">{subtitle}</p>
            )}
          </header>
        )}

        {/* Page Content */}
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

