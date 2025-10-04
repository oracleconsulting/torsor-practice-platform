
import React from 'react';
import { Home, ClipboardList, Map, Users, BookOpen, TrendingUp, Settings, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NavLinkProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  locked?: boolean;
  comingSoon?: boolean;
  badge?: string;
  onClick?: () => void;
}

const NavLink = ({ icon: Icon, label, active, locked, comingSoon, badge, onClick }: NavLinkProps) => {
  return (
    <button
      onClick={onClick}
      disabled={locked}
      className={cn(
        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        active 
          ? "bg-oracle-navy text-white" 
          : locked 
          ? "text-gray-400 cursor-not-allowed" 
          : "text-gray-700 hover:bg-gray-100"
      )}
    >
      <div className="flex items-center space-x-3">
        <Icon className="h-5 w-5" />
        <span>{label}</span>
        {locked && <Lock className="h-4 w-4 ml-2" />}
      </div>
      {badge && (
        <Badge variant={active ? "secondary" : "outline"} className="text-xs">
          {badge}
        </Badge>
      )}
      {comingSoon && (
        <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600">
          Soon
        </Badge>
      )}
    </button>
  );
};

interface SidebarProps {
  progress: any;
  onNavigate: (path: string) => void;
}

export const Sidebar = ({ progress, onNavigate }: SidebarProps) => {
  // Check if Part 2 has been started (has any answers)
  const part2Started = progress.part2Answers && Object.keys(progress.part2Answers).length > 0;

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 min-h-screen">
      <div className="p-4">
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900">Oracle Portal</h2>
                        <p className="text-sm text-gray-600">Your business command centre</p>
        </div>
        
        <nav className="space-y-2">
          <NavLink 
            icon={Home} 
            label="Overview" 
            active 
          />
          <NavLink 
            icon={ClipboardList} 
            label="My Assessment" 
            badge={progress.part1Complete ? 
              (part2Started ? "Continue Part 2" : "Part 2 Available") : 
              "Start"}
            onClick={() => onNavigate('/assessment')}
          />
          <NavLink 
            icon={Map} 
            label="My Roadmap" 
            locked={!progress.roadmapGenerated}
          />
          <NavLink 
            icon={Users} 
            label="My Board" 
            locked={!progress.boardRecommendation}
          />
          <NavLink 
            icon={BookOpen} 
            label="Resources" 
          />
          <NavLink 
            icon={TrendingUp} 
            label="Progress Tracker" 
            comingSoon 
          />
          <NavLink 
            icon={Settings} 
            label="Settings" 
          />
        </nav>
      </div>
    </aside>
  );
};
