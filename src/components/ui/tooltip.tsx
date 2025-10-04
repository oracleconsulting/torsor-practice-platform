import React from 'react';

export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const Tooltip: React.FC = () => null;
export const TooltipTrigger: React.FC = () => null;
export const TooltipContent: React.FC = () => null;
