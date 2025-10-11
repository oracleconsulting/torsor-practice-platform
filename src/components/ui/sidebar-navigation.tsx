import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Grid3x3,
  ClipboardCheck,
  TrendingDown,
  Calendar,
  LineChart,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { transitions } from '@/lib/design-tokens';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

interface SidebarNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const navigationItems: NavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
  },
  {
    id: 'matrix',
    label: 'Skills Matrix',
    icon: Grid3x3,
  },
  {
    id: 'assessment',
    label: 'Assessment',
    icon: ClipboardCheck,
    badge: 'Assess',
    badgeVariant: 'secondary',
  },
  {
    id: 'gaps',
    label: 'Gap Analysis',
    icon: TrendingDown,
    badge: 'Analyze',
    badgeVariant: 'secondary',
  },
  {
    id: 'planning',
    label: 'Development',
    icon: Calendar,
    badge: 'Plan',
    badgeVariant: 'secondary',
  },
  {
    id: 'skills-analysis',
    label: 'Skills Analysis',
    icon: BarChart3,
  },
  {
    id: 'metrics',
    label: 'Team Metrics',
    icon: LineChart,
    badge: 'Track',
    badgeVariant: 'secondary',
  },
];

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  activeTab,
  onTabChange,
  collapsed = false,
  onCollapsedChange,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = !collapsed || isHovered;

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 bottom-0 bg-white border-r border-gray-200 z-30',
        transitions.normal,
        isExpanded ? 'w-64' : 'w-20'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Toggle Button */}
      <div className="absolute -right-3 top-6">
        <Button
          size="icon"
          variant="outline"
          className="h-6 w-6 rounded-full bg-white shadow-md hover:shadow-lg"
          onClick={() => onCollapsedChange?.(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Navigation Items */}
      <nav className="p-3 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                'hover:bg-gray-100 group relative',
                isActive && 'bg-blue-50 text-blue-700 hover:bg-blue-100',
                !isActive && 'text-gray-700'
              )}
            >
              {/* Icon */}
              <Icon
                className={cn(
                  'w-5 h-5 flex-shrink-0',
                  isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                )}
              />

              {/* Label - Only shown when expanded */}
              {isExpanded && (
                <>
                  <span className={cn('text-sm font-medium flex-1 text-left', transitions.fast)}>
                    {item.label}
                  </span>

                  {/* Badge */}
                  {item.badge && (
                    <Badge
                      variant={item.badgeVariant}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}

              {/* Active Indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full" />
              )}

              {/* Tooltip for collapsed state */}
              {!isExpanded && !isHovered && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Progress Indicator (Optional) */}
      {isExpanded && (
        <div className="absolute bottom-4 left-3 right-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs font-medium text-gray-700 mb-2">Quick Stats</p>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Assessments</span>
              <span className="font-semibold">3/5</span>
            </div>
            <div className="flex justify-between">
              <span>Team Capability</span>
              <span className="font-semibold">66%</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

