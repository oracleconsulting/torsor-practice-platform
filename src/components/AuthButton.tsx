import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";
import { Link } from "react-router-dom";

export function AuthButton() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      // Force redirect to home page after sign out
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if there's an error, redirect to home
      window.location.href = '/';
    }
  };

  if (user) {
    return (
      <Button 
        variant="outline" 
        onClick={handleSignOut}
        className="border-oracle-navy text-oracle-navy hover:bg-oracle-navy hover:text-oracle-cream"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    );
  }

  return (
    <Link 
      to="/auth"
      className="text-gray-400 hover:text-white transition-all text-sm md:text-base"
    >
      Sign In
    </Link>
  );
}
