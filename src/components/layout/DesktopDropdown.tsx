import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

interface DropdownItem {
  label: string;
  href: string;
  external?: boolean;
}

interface DropdownSection {
  title: string;
  items: DropdownItem[];
}

interface DesktopDropdownProps {
  section: DropdownSection;
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const DesktopDropdown: React.FC<DesktopDropdownProps> = ({
  section,
  isOpen,
  onMouseEnter,
  onMouseLeave
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="absolute left-0 top-full pt-2 w-56"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <div className="bg-black/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl shadow-black/20 overflow-hidden">
            <div className="p-2">
              {section.items.map((item, index) => (
                item.external ? (
                  <a
                    key={index}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={index}
                    to={item.href}
                    className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  >
                    {item.label}
                  </Link>
                )
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
