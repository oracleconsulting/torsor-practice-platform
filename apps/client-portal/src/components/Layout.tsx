import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import {
  GATutorialModal,
  hasSeenGATutorial,
  markGATutorialSeen,
} from '@/components/GATutorialModal';
import {
  Home,
  ClipboardList,
  Map,
  Flag,
  Heart,
  TrendingUp,
  MessageCircle,
  Calendar,
  LogOut,
  Menu,
  X,
  ChevronRight,
  FileText,
  ArrowLeft,
  HelpCircle,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  /** 'global' = Dashboard/Assessments/Reports only; 'ga' = GA-specific sidebar with back link */
  mode?: 'global' | 'ga';
}

const globalNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Assessments', href: '/assessments', icon: ClipboardList },
  { name: 'Reports', href: '/reports', icon: FileText },
];

const gaNavigation = [
  { name: 'Roadmap', href: '/roadmap', icon: Map },
  { name: 'Sprint', href: '/tasks', icon: Flag },
  { name: 'Life', href: '/life', icon: Heart },
  { name: 'Progress', href: '/progress', icon: TrendingUp },
  { name: 'Chat', href: '/chat', icon: MessageCircle },
  { name: 'Appointments', href: '/appointments', icon: Calendar },
];

export function Layout({ children, title, subtitle, mode }: LayoutProps) {
  const { clientSession, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // Auto-detect mode from path if not explicitly set
  const gaRoutes = ['/roadmap', '/tasks', '/life', '/progress', '/chat', '/appointments'];
  const effectiveMode = mode || (gaRoutes.some(r => location.pathname.startsWith(r)) ? 'ga' : 'global');
  const isGA = effectiveMode === 'ga';

  const enrolledServices = clientSession?.enrolledServices || [];
  const hasGA = enrolledServices.some(s => s === '365_method' || s === '365_alignment');

  // Build nav items based on mode
  const navigation = isGA && hasGA
    ? gaNavigation
    : globalNavigation;

  // GA tutorial — auto-opens on first GA page visit, re-openable via sidebar
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const clientId = clientSession?.clientId ?? null;
  useEffect(() => {
    let cancelled = false;
    if (isGA && hasGA && clientId) {
      hasSeenGATutorial(clientId).then((seen) => {
        if (!cancelled && !seen) setTutorialOpen(true);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [isGA, hasGA, clientId]);
  const handleCloseTutorial = () => {
    setTutorialOpen(false);
    void markGATutorialSeen(clientId);
  };
  const handleOpenTutorial = () => setTutorialOpen(true);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-[#1a2332]">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-[#243044]">
            <Logo className="h-8" variant="dark" />
          </div>

          {/* Client Info */}
          <div className="px-4 py-4 border-b border-[#243044]">
            <p className="text-sm font-medium text-white truncate">
              {clientSession?.name}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {clientSession?.company}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {isGA && (
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-3 py-2 mb-3 text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Dashboard
              </button>
            )}
            {navigation.map((item) => {
              const isActive = item.href === '/assessments'
                ? location.pathname.startsWith('/assessment')
                : location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#4a90d9]/15 text-[#6bb3f0]'
                      : 'text-slate-400 hover:bg-[#243044] hover:text-slate-200'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Help + Sign Out */}
          <div className="p-4 border-t border-[#243044] space-y-1">
            {isGA && hasGA && (
              <button
                onClick={handleOpenTutorial}
                className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-slate-400 hover:bg-[#243044] hover:text-slate-200 rounded-lg transition-colors"
              >
                <HelpCircle className="w-5 h-5" />
                How this works
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-slate-400 hover:bg-[#243044] hover:text-slate-200 rounded-lg transition-colors"
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
          <Logo className="h-8" />
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
            {isGA && (
              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-xs text-slate-400">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
              </Link>
            )}
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
            {isGA && hasGA && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleOpenTutorial();
                }}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-slate-600"
              >
                <HelpCircle className="w-5 h-5" />
                How this works
              </button>
            )}
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
              <h1 className="text-xl font-semibold text-slate-900 font-display">{title}</h1>
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

      {/* GA First-time tutorial */}
      <GATutorialModal open={tutorialOpen} onClose={handleCloseTutorial} />
    </div>
  );
}

