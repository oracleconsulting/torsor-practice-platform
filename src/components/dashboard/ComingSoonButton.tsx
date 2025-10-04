
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface ComingSoonButtonProps {
  icon: LucideIcon;
  label: string;
  description?: string;
}

export const ComingSoonButton: React.FC<ComingSoonButtonProps> = ({
  icon: Icon,
  label,
  description
}) => {
  return (
    <div className="relative">
      <Button 
        variant="outline" 
        className="w-full border-gray-300 text-gray-500 cursor-not-allowed opacity-60"
        disabled
      >
        <Icon className="w-4 h-4 mr-2" />
        {label}
      </Button>
      <Badge 
        className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs"
        variant="secondary"
      >
        Soon
      </Badge>
      {description && (
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      )}
    </div>
  );
};
