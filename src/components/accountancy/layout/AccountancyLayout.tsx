import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Home, Users, AlertTriangle, FileText, TrendingUp, Shield, BarChart3, Leaf, Heart, Crown, Menu, Bell, Search, LogOut, Mail
} from 'lucide-react';
import { ChevronDownIcon, BeakerIcon, ArchiveBoxIcon, CogIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { useAccountancyContext } from '../../contexts/AccountancyContext';
import { useAuth } from '../../contexts/AuthContext';

const AccountancyLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { practice, subscriptionTier } = useAccountancyContext();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inDevelopmentOpen, setInDevelopmentOpen] = useState(false);
  const isProfessionalPlus = ['professional', 'excellence', 'enterprise'].includes(subscriptionTier);

  // Add data attribute for CSS targeting
  useEffect(() => {
    document.body.setAttribute('data-portal', 'accountancy');
    
    return () => {
      document.body.removeAttribute('data-portal');
    };
  }, []);

  const menuItems = [
    { label: 'Dashboard', icon: Home, href: '/accountancy/dashboard', available: true },
    { label: 'Client Management', icon: Users, href: '/accountancy/client-management', available: true },
    { label: 'Health Score', icon: FileText, href: '/accountancy/health', available: true },
    { label: 'Team Management', icon: Users, href: '/accountancy/team', available: subscriptionTier !== 'free', badge: 'NEW' },
    { label: 'Client Rescues', icon: AlertTriangle, href: '/accountancy/client-rescues', available: subscriptionTier !== 'free', badge: 'PRO' },
    { label: 'Advisory Services', icon: TrendingUp, href: '/accountancy/advisory-services', available: true },
    { label: 'Client Outreach', icon: Mail, href: '/accountancy/outreach', available: true },
    { label: 'Client Vault', icon: ArchiveBoxIcon, href: '/accountancy/portal/client-vault', available: isProfessionalPlus, badge: 'NEW' },
    { label: 'Systems Audit', icon: CogIcon, href: '/accountancy/portal/systems-audit', available: isProfessionalPlus, badge: 'NEW' },
    { label: '365 Alignment', icon: CalendarDaysIcon, href: '/accountancy/portal/365-alignment', available: isProfessionalPlus, badge: 'PRO' },
    { label: 'Manage Subscription', icon: Crown, href: '/accountancy/manage-subscription', available: true },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/accountancy/auth');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div 
      data-portal="accountancy" 
      className="main-layout"
    >
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-light">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-blue rounded-lg flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-lg font-semibold text-primary">ORACLE</h1>
                <p className="text-xs text-secondary">ACCOUNTANCY</p>
              </div>
            )}
          </div>
        </div>

        {/* Subscription Tier */}
        {!sidebarCollapsed && (
          <div className="p-4">
            <div className="bg-secondary rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-primary">
                  {subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)} Tier
                </span>
                {subscriptionTier === 'free' && (
                  <span className="text-xs bg-primary-blue text-white px-2 py-1 rounded-full">
                    Free
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 pb-4">
          {/* Core Section */}
          <div className="nav-section">
            <div className="nav-section-label">Core</div>
            {menuItems.slice(0, 3).map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={index}
                  to={item.href}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={closeSidebar}
                >
                  <Icon className="icon" />
                  {!sidebarCollapsed && (
                    <span>{item.label}</span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Team & Growth Section */}
          <div className="nav-section">
            <div className="nav-section-label">Team & Growth</div>
            {menuItems.slice(3, 10).map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              const showItem = item.available || subscriptionTier !== 'free';
              return showItem ? (
                <Link
                  key={index + 3}
                  to={item.href}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={closeSidebar}
                >
                  <div className="flex items-center w-full">
                    <Icon className="icon" />
                    {!sidebarCollapsed && (
                      <>
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className={`ml-auto text-xs px-2 py-1 rounded-full ${
                            item.badge === 'NEW' ? 'bg-primary-blue text-white' : 'bg-semantic-warning text-white'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </Link>
              ) : null;
            })}
          </div>

          {/* In Development Section */}
          <div className="mt-6 border-t border-gray-700 pt-6">
            <button
              onClick={() => setInDevelopmentOpen(!inDevelopmentOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors group"
            >
              <div className="flex items-center">
                <BeakerIcon className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-300" />
                {!sidebarCollapsed && <span>In Development</span>}
              </div>
              {!sidebarCollapsed && (
                <ChevronDownIcon 
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                    inDevelopmentOpen ? 'rotate-180' : ''
                  }`} 
                />
              )}
            </button>
            
            {inDevelopmentOpen && !sidebarCollapsed && (
              <div className="ml-4 mt-2 space-y-1 animate-fadeIn">
                <Link
                  to="/accountancy/client-rescues"
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    location.pathname === '/accountancy/client-rescues'
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5 mr-3" />
                  <span>Client Rescues</span>
                  <span className="ml-auto bg-blue-500 text-white text-xs px-2 py-0.5 rounded">PRO</span>
                </Link>
                
                <Link
                  to="/accountancy/compliance"
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    location.pathname === '/accountancy/compliance'
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Shield className="w-5 h-5 mr-3" />
                  <span>Regulatory Compliance</span>
                  <span className="ml-auto bg-blue-500 text-white text-xs px-2 py-0.5 rounded">PRO</span>
                </Link>

                <Link
                  to="/accountancy/alternate-auditor"
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    location.pathname === '/accountancy/alternate-auditor'
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Shield className="w-5 h-5 mr-3" />
                  <span>Alternate Auditor</span>
                  <span className="ml-auto bg-orange-500 text-white text-xs px-2 py-0.5 rounded">NEW</span>
                </Link>

                <Link
                  to="/accountancy/mtd-capacity"
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    location.pathname === '/accountancy/mtd-capacity'
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <BarChart3 className="w-5 h-5 mr-3" />
                  <span>MTD Capacity</span>
                  <span className="ml-auto bg-orange-500 text-white text-xs px-2 py-0.5 rounded">NEW</span>
                </Link>

                <Link
                  to="/accountancy/esg-reporting"
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    location.pathname === '/accountancy/esg-reporting'
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Leaf className="w-5 h-5 mr-3" />
                  <span>ESG Reporting</span>
                  <span className="ml-auto bg-orange-500 text-white text-xs px-2 py-0.5 rounded">NEW</span>
                </Link>

                <Link
                  to="/accountancy/team-wellness"
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    location.pathname === '/accountancy/team-wellness'
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Heart className="w-5 h-5 mr-3" />
                  <span>Team Wellness</span>
                  <span className="ml-auto bg-orange-500 text-white text-xs px-2 py-0.5 rounded">NEW</span>
                </Link>

                <Link
                  to="/accountancy/cyber-security"
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    location.pathname === '/accountancy/cyber-security'
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Shield className="w-5 h-5 mr-3" />
                  <span>Cyber Security Shield</span>
                  <span className="ml-auto bg-orange-500 text-white text-xs px-2 py-0.5 rounded">NEW</span>
                </Link>
              </div>
            )}
          </div>

          {/* Settings Section */}
          <div className="nav-section">
            <div className="nav-section-label">Settings</div>
            {menuItems.slice(10).map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={index + 10}
                  to={item.href}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={closeSidebar}
                >
                  <Icon className="icon" />
                  {!sidebarCollapsed && (
                    <span>{item.label}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-light">
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center p-2 text-secondary hover:text-primary hover:bg-secondary rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="header">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-secondary hover:text-primary hover:bg-secondary rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="header-title">Welcome back, {user?.user_metadata?.name || 'James'}</h1>
              <p className="header-subtitle">{practice?.name || 'IVC Accounting'} • {subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)} Tier</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="p-2 text-secondary hover:text-primary hover:bg-secondary rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2 text-secondary hover:text-primary hover:bg-secondary rounded-lg transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 p-2 bg-secondary rounded-lg">
              <div className="w-8 h-8 bg-primary-blue rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.user_metadata?.name?.charAt(0) || 'J'}
                </span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-primary">{user?.user_metadata?.name || 'James Howard'}</p>
                <p className="text-xs text-secondary">{user?.email || 'james@ivcaccounting.co.uk'}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 text-secondary hover:text-primary hover:bg-secondary rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AccountancyLayout;