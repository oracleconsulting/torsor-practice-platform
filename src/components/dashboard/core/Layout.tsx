import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Brain, Home, Mountain, Target, Users, BookOpen, Link, MessageSquare, 
  Gift, BarChart3, Settings, Search, Bell, Menu, X, Sun, Moon, Cloud, 
  Sparkles, PlusCircle, User, LogOut, ChevronLeft, Activity, Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useOracleData } from '@/hooks/useOracleData';
import { ProgressOverview } from '@/components/dashboard/ProgressOverview';
import RoadmapDisplay from '@/components/dashboard/RoadmapDisplay';
import { AssessmentsPage } from '@/components/dashboard/AssessmentsPage';
import { MyJourneyPage } from '@/components/dashboard/MyJourneyPage';
import { TwelveWeekPlanPage } from '@/components/dashboard/TwelveWeekPlanPage';
import { AIBoardPage } from '@/components/dashboard/AIBoardPage';
import { CommandCenterPage } from '@/components/dashboard/CommandCenterPage';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  comingSoon?: boolean;
}

interface PlaceholderPageProps {
  title: string;
  icon: React.FC<any>;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, icon: Icon }) => (
  <div className="h-full flex items-center justify-center">
    <div className="text-center">
      <Icon className="w-16 h-16 text-purple-400 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-500">Coming soon...</p>
    </div>
  </div>
);

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  // Core States
  const [activeSection, setActiveSection] = useState('command');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState('morning');
  const [notifications, setNotifications] = useState(3);
  const [businessHealth, setBusinessHealth] = useState(85);
  const [userEnergy, setUserEnergy] = useState(75);
  const [searchOpen, setSearchOpen] = useState(false);
  
  // React Router hooks
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { data } = useOracleData();
  
  // Navigation structure
  const navigationSections: NavigationItem[] = [
    { id: 'command', label: 'Command Centre', icon: Home, color: 'purple' },
    { id: 'journey', label: 'My Journey', icon: Mountain, color: 'blue' },
    { id: 'roadmap', label: '12-Week Plan', icon: Target, color: 'green' },
    { id: 'board', label: 'AI Board', icon: Users, color: 'pink' },
    { id: 'knowledge', label: 'Knowledge Hub', icon: BookOpen, color: 'yellow', comingSoon: true },
    { id: 'integrations', label: 'Integrations', icon: Link, color: 'indigo', comingSoon: true },
    { id: 'community', label: 'Community', icon: MessageSquare, color: 'teal', comingSoon: true },
    { id: 'referral', label: 'Referral Program', icon: Gift, color: 'orange', comingSoon: true },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'red', comingSoon: true }
  ];
  
  // Update active section based on route
  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (path && path !== 'dashboard') {
      setActiveSection(path);
    } else {
      setActiveSection('command');
    }
  }, [location]);
  
  // Time detection
  useEffect(() => {
    const updateTimeOfDay = () => {
      const hour = new Date().getHours();
      if (hour < 12) setTimeOfDay('morning');
      else if (hour < 17) setTimeOfDay('afternoon');
      else if (hour < 21) setTimeOfDay('evening');
      else setTimeOfDay('night');
    };
    
    updateTimeOfDay();
    const interval = setInterval(updateTimeOfDay, 60000);
    return () => clearInterval(interval);
  }, []);
  
  // Dynamic greeting
  const getGreeting = () => {
    const greetings = {
      morning: 'Good morning, James ☕',
      afternoon: 'Good afternoon, James 🚀',
      evening: 'Good evening, James 🌅',
      night: 'Working late, James? 🦉'
    } as const;
    return greetings[timeOfDay as keyof typeof greetings];
  };
  
  // Theme based on time
  const getThemeColors = () => {
    const themes = {
      morning: { bg: 'from-purple-50 via-pink-50 to-white', accent: 'from-purple-400 to-pink-400' },
      afternoon: { bg: 'from-orange-50 via-yellow-50 to-white', accent: 'from-orange-400 to-yellow-400' },
      evening: { bg: 'from-blue-50 via-indigo-50 to-purple-50', accent: 'from-blue-400 to-indigo-400' },
      night: { bg: 'from-gray-900 via-purple-900 to-black', accent: 'from-purple-600 to-pink-600' }
    } as const;
    return themes[timeOfDay as keyof typeof themes];
  };
  
  const theme = getThemeColors();
  const isDarkMode = timeOfDay === 'night';
  
  // Handle navigation
  const handleNavigation = (sectionId: string) => {
    if (!navigationSections.find(s => s.id === sectionId)?.comingSoon) {
      setActiveSection(sectionId);
      if (sectionId === 'command') {
        navigate('/dashboard');
      } else {
        navigate(`/dashboard/${sectionId}`);
      }
    }
  };
  
  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
      window.location.href = '/';
    }
  };
  
  // Check if assessment is complete
  const isAssessmentComplete = () => {
    return data?.part1Complete && data?.part2Complete;
  };
  
  // Page renderer
  const renderPage = () => {
    switch(activeSection) {
      case 'command': return <CommandCenterPage />;
      case 'assessments': return <AssessmentsPage isComplete={isAssessmentComplete()} />;
      case 'journey': return <MyJourneyPage />;
      case 'roadmap': return <TwelveWeekPlanPage />;
      case 'board': return <AIBoardPage />;
      case 'knowledge': return <PlaceholderPage title="Knowledge Hub" icon={BookOpen} />;
      case 'integrations': return <PlaceholderPage title="Integrations" icon={Link} />;
      case 'analytics': return <PlaceholderPage title="Analytics" icon={BarChart3} />;
      default: return <CommandCenterPage />;
    }
  };
  
  return (
    <div className={`h-screen w-screen overflow-hidden bg-gradient-to-br ${theme.bg} transition-all duration-1000`}>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Floating orbs */}
        <motion.div
          className="absolute top-20 left-20 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-20"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-pink-200 rounded-full blur-3xl opacity-20"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      
      {/* Sidebar */}
      <motion.aside
        className={`fixed left-0 top-0 bottom-0 z-20 ${isDarkMode ? 'bg-gray-900/90' : 'bg-white/80'} backdrop-blur-xl shadow-2xl h-full overflow-y-auto`}
        animate={{ width: sidebarCollapsed ? 70 : 280 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {/* Logo Section */}
        <div className="p-4 border-b border-gray-200/20">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center gap-3"
          >
            <motion.div
              className={`w-12 h-12 bg-gradient-to-br ${theme.accent} rounded-xl flex items-center justify-center shadow-lg`}
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Brain className="w-7 h-7 text-white" />
            </motion.div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-left"
                >
                  <h1 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    Oracle AI
                  </h1>
                  <p className="text-xs text-gray-500">Living Dashboard</p>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="px-3 py-4 space-y-1">
          {navigationSections.map((section, index) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <motion.button
                key={section.id}
                onClick={() => handleNavigation(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative ${
                  isActive 
                    ? `bg-gradient-to-r ${theme.accent} text-white shadow-lg` 
                    : section.comingSoon
                    ? 'text-gray-400 cursor-not-allowed'
                    : `${isDarkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`
                }`}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={!section.comingSoon ? { x: 5 } : {}}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
                {!sidebarCollapsed && (
                  <>
                    <span className="text-sm font-medium">{section.label}</span>
                    {section.comingSoon && (
                      <span className="ml-auto text-xs bg-gray-500/20 px-2 py-0.5 rounded-full">
                        Soon
                      </span>
                    )}
                  </>
                )}
              </motion.button>
            );
          })}
        </nav>
        
        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200/20">
          <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
            isDarkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
          }`}>
            <Settings className="w-5 h-5" />
            {!sidebarCollapsed && <span className="text-sm">Settings</span>}
          </button>
          <button 
            onClick={handleSignOut}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
              isDarkMode ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'
            }`}
          >
            <LogOut className="w-5 h-5" />
            {!sidebarCollapsed && <span className="text-sm">Sign Out</span>}
          </button>
        </div>
      </motion.aside>
      
      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-[70px]' : 'ml-[280px]'} h-screen flex flex-col`}>
        {/* Header */}
        <motion.header
          className={`flex-shrink-0 px-8 py-4 ${isDarkMode ? 'bg-gray-900/80' : 'bg-white/60'} backdrop-blur-xl border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200/50'} z-10`}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between">
            {/* Left side */}
            <div className="flex items-center gap-6">
              <div>
                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  {getGreeting()}
                </h2>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    Business: {businessHealth}% healthy
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Energy: {userEnergy}%
                  </span>
                </div>
              </div>
            </div>
            
            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className={`p-2 rounded-lg transition-all ${
                    isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                  }`}
                >
                  <Search className="w-5 h-5" />
                </button>
                <AnimatePresence>
                  {searchOpen && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 300, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="absolute right-0 top-full mt-2"
                    >
                      <input
                        type="text"
                        placeholder="Search anything..."
                        className={`w-full px-4 py-2 rounded-lg ${
                          isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'
                        } shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400`}
                        autoFocus
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Notifications */}
              <motion.button
                className={`relative p-2 rounded-lg transition-all ${
                  isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full text-xs text-white flex items-center justify-center"
                  >
                    {notifications}
                  </motion.span>
                )}
              </motion.button>

              {/* Sign Out Button */}
              <motion.button
                onClick={handleSignOut}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  isDarkMode 
                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' 
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </motion.button>
              
              {/* Quick Oracle */}
              <motion.button
                className={`px-4 py-2 bg-gradient-to-r ${theme.accent} rounded-lg text-white text-sm font-medium flex items-center gap-2 shadow-lg`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Sparkles className="w-4 h-4" />
                Ask Oracle
              </motion.button>
              
              {/* User Menu */}
              <div className="ml-2 relative group">
                <motion.div
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                >
                  J
                </motion.div>
                <div className="absolute right-0 top-full mt-2 w-48 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              {activeSection === 'command' && data ? (
                <div className="min-h-full">
                  <div className="p-4">
                    <ProgressOverview />
                    {data.roadmap && (
                      <RoadmapDisplay roadmap={data.roadmap} groupId={data.groupId} />
                    )}
                  </div>
                  <CommandCenterPage />
                </div>
              ) : (
                renderPage()
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}; 