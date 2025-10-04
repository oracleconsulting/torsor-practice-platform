import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { MobileMenu } from './MobileMenu';
import { DesktopDropdown } from './DesktopDropdown';
import { AuthButton } from '@/components/AuthButton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { ThemeContext } from '@/contexts/ThemeContext';

// Navigation Items Configuration
const navItems = {
  platform: {
    title: 'Platform',
    items: [
      { label: 'How It Works', href: '/how-it-works' },
      { label: 'Meet the Board', href: '/meet-the-board' },
      { label: 'The 365 Method', href: '/365-method' },
      { label: 'Accountancy', href: '/accountancy/dashboard' },
      { label: 'Integrations', href: '/integrations' }
    ]
  },
  solutions: {
    title: 'Solutions',
    items: [
      { label: 'For Exhausted Founders', href: '/solutions/founders' },
      { label: 'For Growing Teams', href: '/solutions/teams' },
      { label: 'For Side Hustlers', href: '/solutions/side-hustlers' },
      { label: 'Accountancy Portal', href: 'https://oracle-api-server-production.up.railway.app', external: true },
      { label: 'The Healthy Practice', href: '/portal/healthcare' }
    ]
  },
  resources: {
    title: 'Resources',
    items: [
      { label: 'Blog & Insights', href: '/blog' },
      { label: 'ROI Calculator', href: '/roi-calculator' },
      { label: 'Success Stories', href: '/success-stories' },
      { label: 'Community (Coming Soon)', href: '/community' }
    ]
  }
};

const isAdmin = (email: string) => email === 'james@ivcaccounting.co.uk';

// Main Header Component
const DynamicHeader: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const themeContext = React.useContext(ThemeContext);
  const theme = themeContext?.theme || 'orange';
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (user?.email) {
        const { data } = await supabase
          .from('admin_users')
          .select('is_super_admin')
          .eq('email', user.email)
          .single();
        
        setIsSuperAdmin(data?.is_super_admin || false);
      } else {
        setIsSuperAdmin(false);
      }
    };

    checkSuperAdmin();
  }, [user]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = (menuKey: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setActiveMenu(menuKey);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 150);
  };

  const handleDropdownEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const handleDropdownLeave = () => {
    setActiveMenu(null);
  };

  const isHomePage = location.pathname === '/';

  const getNavItemColor = () => {
    switch (theme) {
      case 'orange': return 'text-orange-400';
      case 'purple': return 'text-purple-400';
      case 'pink': return 'text-pink-400';
      case 'blue': return 'text-blue-400';
      default: return 'text-white';
    }
  };

  return (
    <>
      <motion.header
        ref={headerRef}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500`}
        style={{
          backgroundColor: scrolled || !isHomePage 
            ? 'rgba(0, 0, 0, 0.95)' 
            : 'rgba(0, 0, 0, 0)',
          backdropFilter: scrolled || !isHomePage ? 'blur(20px)' : 'none'
        }}
      >
        <div className="container mx-auto px-4 md:px-6">
          <nav className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link 
              to="/"
              className="flex items-center gap-2"
            >
              <motion.span
                className="text-xl md:text-2xl font-bold transition-colors duration-500"
                style={{
                  color: isHomePage ? getNavItemColor() : '#ffffff',
                  textShadow: isHomePage ? '0 0 20px currentColor' : 'none'
                }}
              >
                Oracle
              </motion.span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {Object.entries(navItems).map(([key, item]) => (
                <div key={key} className="relative">
                  <motion.button
                    onMouseEnter={() => handleMouseEnter(key)}
                    onMouseLeave={handleMouseLeave}
                    className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                      activeMenu === key 
                        ? 'bg-white/10 text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                    style={{
                      color: activeMenu !== key && isHomePage ? getNavItemColor() : undefined
                    }}
                  >
                    {item.title}
                    <ChevronDown className={`w-4 h-4 transition-transform ${
                      activeMenu === key ? 'rotate-180' : ''
                    }`} />
                  </motion.button>
                  <DesktopDropdown 
                    section={item} 
                    isOpen={activeMenu === key}
                    onMouseEnter={handleDropdownEnter}
                    onMouseLeave={handleDropdownLeave}
                  />
                </div>
              ))}
              
              <Link 
                to="/pricing" 
                className="px-4 py-2 text-gray-400 hover:text-white transition-all"
                style={{
                  color: isHomePage ? getNavItemColor() : undefined
                }}
              >
                Pricing
              </Link>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Show super admin link if user is super admin */}
              {user && isSuperAdmin && (
                <Link 
                  to="/admin"
                  className="text-purple-400 hover:text-purple-300 transition-all hidden sm:block text-sm md:text-base"
                >
                  Admin
                </Link>
              )}

              {/* Show Dashboard link if user is logged in */}
              {user && (
                <Link 
                  to="/dashboard"
                  className="text-gray-400 hover:text-white transition-all hidden sm:block text-sm md:text-base"
                  style={{
                    color: isHomePage ? getNavItemColor() : undefined
                  }}
                >
                  Dashboard
                </Link>
              )}

              {/* Auth Button */}
              <AuthButton />

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Open mobile menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </nav>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)}
        navItems={navItems}
      />
    </>
  );
};

export default DynamicHeader;
