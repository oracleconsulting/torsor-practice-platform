import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DisclosureSectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
  className?: string;
}

export const DisclosureSection: React.FC<DisclosureSectionProps> = ({
  title,
  description,
  icon,
  children,
  defaultOpen = false,
  badge,
  className
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className={cn('bg-gray-800 border-gray-700', className)}>
      <CardHeader className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && <div className="text-blue-500">{icon}</div>}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                {badge && (
                  <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                    {badge}
                  </span>
                )}
              </div>
              {description && (
                <p className="text-sm text-gray-400 mt-1">{description}</p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm">
            {isOpen ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-400" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      {isOpen && (
        <CardContent className="pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  );
};

export default DisclosureSection;

