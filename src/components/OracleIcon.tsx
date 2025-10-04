
import React from 'react';

interface OracleIconProps {
  type: 'sprint-3month' | 'shift-6month' | 'vision-5year' | 'stopwatch' | 'implementation' | 'team-innovation' | 'navigation' | 'tools' | 'energy' | 'brain-power' | 'warning' | 'decline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const iconPaths = {
  // 365 Method Core Icons (lighter backgrounds)
  'sprint-3month': '/lovable-uploads/132a75a3-b501-41c7-8fcf-e035cef15b43.png', // Calendar with checkmark
  'shift-6month': '/lovable-uploads/64aaf498-0709-4a30-8de1-15996bda07f4.png', // Gear and wrench
  'vision-5year': '/lovable-uploads/acdc85ae-ffe6-495a-8639-1704c4766425.png', // Compass
  
  // Additional Process Icons (lighter backgrounds)
  'stopwatch': '/lovable-uploads/0a5ca340-22b9-4efb-8844-7d6faca86f3f.png', // Stopwatch with segments
  'implementation': '/lovable-uploads/d6f23e9b-a740-4ace-b50c-0d11a17fcd9c.png', // Briefcase with gears
  'team-innovation': '/lovable-uploads/e0d3d692-41ce-4d1f-94bd-0791953b0a75.png', // Team with lightbulb
  
  // Support Icons (darker backgrounds needed)
  'navigation': '/lovable-uploads/e8fc9428-fbac-4eb3-b581-7e6a88918429.png', // Compass (original)
  'tools': '/lovable-uploads/a32c6266-3eca-40bf-8181-9553db189e9c.png', // Wrench (original)
  'energy': '/lovable-uploads/a339418d-260b-4971-b911-53ce5b7ebe78.png', // Battery charging
  'brain-power': '/lovable-uploads/4cea48af-2b5f-4398-9afa-9670b0255a09.png', // Brain with lightning
  'warning': '/lovable-uploads/453ef170-6f2f-4f56-8c89-3756de001c7f.png', // Warning with bed
  'decline': '/lovable-uploads/c70a676b-2a35-4a05-81b6-1ee2e0d74905.png' // Chart declining
};

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12'
};

const OracleIcon: React.FC<OracleIconProps> = ({ type, size = 'md', className = '' }) => {
  const iconPath = iconPaths[type];
  const sizeClass = sizeClasses[size];

  if (!iconPath) {
    console.warn(`OracleIcon: Unknown icon type "${type}"`);
    return null;
  }

  return (
    <img 
      src={iconPath} 
      alt={`Oracle ${type} icon`} 
      className={`${sizeClass} ${className}`}
    />
  );
};

export default OracleIcon;
