
import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = "", 
  onClick = undefined 
}) => (
  <div 
    className={cn(
      "bg-white rounded-xl p-6",
      "border border-gray-200 transition-all duration-300",
      onClick ? "cursor-pointer hover:bg-gray-50" : "",
      className
    )}
    onClick={onClick}
  >
    {children}
  </div>
);
