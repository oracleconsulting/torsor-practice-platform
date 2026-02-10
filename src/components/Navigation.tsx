import { LayoutDashboard, Target, TrendingUp, Brain, Users, ClipboardList, Truck, Settings, Award, BookOpen, Database, Calculator, Wrench } from 'lucide-react';
import type { NavigationProps } from '../types/navigation';

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const links = [
    { id: 'heatmap' as const, label: 'Skills Heatmap', icon: LayoutDashboard },
    { id: 'management' as const, label: 'Skills Management', icon: TrendingUp },
    { id: 'readiness' as const, label: 'Service Readiness', icon: Target },
    { id: 'analytics' as const, label: 'Team Analytics', icon: Brain },
    { id: 'cpd' as const, label: 'CPD Tracker', icon: Award },
    { id: 'training' as const, label: 'Training', icon: BookOpen },
    { id: 'clients' as const, label: 'Client Services', icon: Users },
    { id: 'ma-portal' as const, label: 'BI Portal', icon: Calculator },
    { id: 'assessments' as const, label: 'Assessments', icon: ClipboardList },
    { id: 'delivery' as const, label: 'Delivery Teams', icon: Truck },
    { id: 'config' as const, label: 'Service Config', icon: Settings },
    { id: 'service-builder' as const, label: 'Service Line Builder', icon: Wrench },
    { id: 'knowledge' as const, label: 'Knowledge Base', icon: Database },
  ];

  return (
    <div className="bg-gray-800 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-8">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = currentPage === link.id;
            
            return (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className={`px-4 py-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                  isActive
                    ? 'text-white border-orange-500'
                    : 'text-gray-300 border-transparent hover:text-white hover:border-gray-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

