import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Menu, X } from "lucide-react";
import { useState } from "react";

export const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isOnDashboard = location.pathname === '/dashboard';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          {/* Logo and Desktop Nav */}
          <div className="flex items-center gap-8">
            <img 
              src="/logo.png" 
              alt="Oracle" 
              className="h-10 w-auto cursor-pointer transition-transform hover:scale-105"
              onClick={() => navigate('/dashboard')} />
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <a href="/dashboard" className="text-gray-300 hover:text-white transition font-medium">Dashboard</a>
              <a href="/accountancy" className="text-gray-300 hover:text-gold-400 transition font-medium">Accountancy</a>
            </nav>
          </div>
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {user && !isOnDashboard && (
              <Button
                onClick={() => navigate('/dashboard')}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Button>
            )}
            {user ? (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => signOut()}
                className="text-gray-300 hover:text-white"
              >
                Sign Out
              </Button>
            ) : (
              <Button 
                size="sm"
                onClick={() => navigate('/auth')}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Sign In
              </Button>
            )}
          </div>
          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-300 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800">
            <nav className="flex flex-col gap-4">
              <a href="/dashboard" className="text-gray-300 hover:text-white">Dashboard</a>
              <a href="/accountancy" className="text-gray-300 hover:text-gold-400">Accountancy</a>
              {user && !isOnDashboard && (
                <Button
                  onClick={() => navigate('/dashboard')}
                  className="bg-purple-600 hover:bg-purple-700 text-white w-full"
                >
                  Go to Dashboard
                </Button>
              )}
              {user ? (
                <Button 
                  variant="ghost" 
                  onClick={() => signOut()}
                  className="text-gray-300 hover:text-white w-full"
                >
                  Sign Out
                </Button>
              ) : (
                <Button 
                  onClick={() => navigate('/auth')}
                  className="bg-purple-600 hover:bg-purple-700 text-white w-full"
                >
                  Sign In
                </Button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
export default Header; 