import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MenuItem {
  label: string;
  href: string;
  external?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: {
    [key: string]: MenuSection;
  };
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, navItems }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 lg:hidden"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
          
          {/* Menu Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="absolute right-0 top-0 h-full w-80 bg-black/95 backdrop-blur-xl border-l border-gray-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <span className="text-xl font-bold text-white">Menu</span>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Navigation */}
            <div className="flex flex-col p-6 space-y-6 overflow-y-auto">
              {Object.entries(navItems).map(([key, section]) => (
                <div key={key}>
                  <div className="text-white font-semibold mb-3 text-lg">{section.title}</div>
                  <div className="space-y-2 ml-4">
                    {section.items.map((item, idx) => (
                      item.external ? (
                        <a
                          key={idx}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={onClose}
                          className="block py-3 text-gray-300 hover:text-white transition-colors min-h-[44px] flex items-center"
                        >
                          {item.label}
                        </a>
                      ) : (
                        <Link
                          key={idx}
                          to={item.href}
                          onClick={onClose}
                          className="block py-3 text-gray-300 hover:text-white transition-colors min-h-[44px] flex items-center"
                        >
                          {item.label}
                        </Link>
                      )
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Pricing */}
              <Link
                to="/pricing"
                onClick={onClose}
                className="text-white font-semibold text-lg py-3 min-h-[44px] flex items-center"
              >
                Pricing
              </Link>
              
              {/* Auth Links */}
              <div className="pt-6 border-t border-gray-800 space-y-4">
                <Link
                  to="/auth"
                  onClick={onClose}
                  className="block py-3 text-center text-gray-300 hover:text-white transition-colors border border-gray-700 rounded-lg min-h-[44px] flex items-center justify-center"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth"
                  onClick={onClose}
                  className="block py-3 text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all min-h-[44px] flex items-center justify-center"
                >
                  Start Free Assessment
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
