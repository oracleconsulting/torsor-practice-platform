import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Plus, X, FileDown, Play, HelpCircle, Search } from 'lucide-react';
import { transitions, zIndex } from '@/lib/design-tokens';

interface FABAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  actions: FABAction[];
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  actions,
  position = 'bottom-right',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  return (
    <div className={`fixed ${positionClasses[position]}`} style={{ zIndex: zIndex.fab }}>
      {/* Action Buttons - appear when FAB is opened */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 flex flex-col gap-2 mb-2">
          {actions.map((action, index) => (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className={`rounded-full shadow-lg ${transitions.spring} animate-in slide-in-from-bottom-2`}
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => {
                      action.onClick();
                      setIsOpen(false);
                    }}
                  >
                    {action.icon}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>{action.label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      )}

      {/* Main FAB Button */}
      <Button
        size="lg"
        className={`rounded-full shadow-2xl h-14 w-14 ${transitions.spring} ${
          isOpen ? 'rotate-45' : ''
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </Button>
    </div>
  );
};

// Predefined FAB configurations
export const useSkillsFABActions = ({
  onStartAssessment,
  onExport,
  onHelp,
  onSearch,
}: {
  onStartAssessment: () => void;
  onExport: () => void;
  onHelp: () => void;
  onSearch: () => void;
}): FABAction[] => {
  return [
    {
      icon: <Play className="h-5 w-5" />,
      label: 'Start Assessment',
      onClick: onStartAssessment,
    },
    {
      icon: <FileDown className="h-5 w-5" />,
      label: 'Export Data',
      onClick: onExport,
    },
    {
      icon: <Search className="h-5 w-5" />,
      label: 'Search',
      onClick: onSearch,
    },
    {
      icon: <HelpCircle className="h-5 w-5" />,
      label: 'Help & Shortcuts',
      onClick: onHelp,
    },
  ];
};

