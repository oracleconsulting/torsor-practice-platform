import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

// Theme Context
export const ThemeContext = React.createContext({
  currentTheme: 'orange',
  setCurrentTheme: (theme: string) => {},
  isValleyActive: true,
  setIsValleyActive: (active: boolean) => {}
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('orange');
  const [isValleyActive, setIsValleyActive] = useState(true);

  return (
    <ThemeContext.Provider value={{ currentTheme, setCurrentTheme, isValleyActive, setIsValleyActive }}>
      {children}
    </ThemeContext.Provider>
  );
};

const DynamicHeader: React.FC = () => {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHomePage = location.pathname === '/';

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || !isHomePage
          ? 'bg-black/90 backdrop-blur-lg border-b border-gray-800'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">O</span>
            </div>
            <span className="text-xl font-bold text-white">Oracle Method</span>
          </Link>

          {/* Navigation - Dashboard focused */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/dashboard"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/accountancy"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Accountancy
            </Link>
          </nav>

          {/* CTA Button */}
          <Link
            to="/auth"
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all"
          >
            Sign In
          </Link>
        </div>
      </div>
    </motion.header>
  );
};

export default DynamicHeader;
