import {
  Users,
  Target,
  Calculator,
  Truck,
  LayoutDashboard,
  TrendingUp,
  Brain,
  Award,
  BookOpen,
  ClipboardList,
  Settings,
  Wrench,
  Box,
  Database,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import type { NavigationProps, NavSection } from '../types/navigation';

interface SidebarNavigationProps extends NavigationProps {
  mobile?: boolean;
}

const sections: NavSection[] = [
  {
    title: 'CLIENTS',
    items: [
      { id: 'clients', label: 'Client Services', icon: Users },
      { id: 'ga-dashboard', label: 'Goal Alignment', icon: Target },
      { id: 'ma-portal', label: 'BI Portal', icon: Calculator },
      { id: 'delivery', label: 'Delivery Teams', icon: Truck },
    ],
  },
  {
    title: 'TEAM',
    items: [
      { id: 'heatmap', label: 'Skills Heatmap', icon: LayoutDashboard },
      { id: 'management', label: 'Skills Management', icon: TrendingUp },
      { id: 'analytics', label: 'Team Analytics', icon: Brain },
      { id: 'cpd', label: 'CPD Tracker', icon: Award },
      { id: 'training', label: 'Training', icon: BookOpen },
    ],
  },
  {
    title: 'PRACTICE',
    items: [
      { id: 'readiness', label: 'Service Readiness', icon: Target },
      { id: 'assessments', label: 'Assessments', icon: ClipboardList },
    ],
  },
  {
    title: 'CONFIGURATION',
    items: [
      { id: 'config', label: 'Service Config', icon: Settings },
      { id: 'service-builder', label: 'Service Line Builder', icon: Wrench },
      { id: 'tech-database', label: 'Tech Database', icon: Box },
      { id: 'knowledge', label: 'Knowledge Base', icon: Database },
    ],
  },
];

export function Navigation({ currentPage, onNavigate, mobile }: SidebarNavigationProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`${
        mobile
          ? 'relative w-full bg-[#1a2332]'
          : `fixed top-0 left-0 z-40 h-full bg-[#1a2332] border-r border-[#243044] transition-all duration-200 ${
              collapsed ? 'w-[68px]' : 'w-[240px]'
            }`
      } flex flex-col`}
    >
      {!mobile && (
        <div className="flex items-center justify-between h-16 px-4 border-b border-[#243044]">
          {!collapsed && (
            <span className="text-lg font-bold text-white tracking-tight">
              Torsor
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-[#243044] transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      )}

      <nav className={`flex-1 overflow-y-auto py-4 px-3 space-y-6 ${mobile ? 'max-h-[70vh]' : ''}`}>
        {sections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    title={collapsed && !mobile ? item.label : undefined}
                    className={`flex items-center gap-3 w-full rounded-lg transition-colors text-sm font-medium ${
                      collapsed && !mobile ? 'justify-center px-2 py-2.5' : 'px-3 py-2'
                    } ${
                      isActive
                        ? 'bg-[#4a90d9]/15 text-[#6bb3f0]'
                        : 'text-slate-400 hover:bg-[#243044] hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                    {(!collapsed || mobile) && <span>{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
