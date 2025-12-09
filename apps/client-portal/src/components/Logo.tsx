// ============================================================================
// RPGCC LOGO COMPONENT
// ============================================================================
// Handles both light and dark background variants
// Falls back to text-based logo if image files are not found
// ============================================================================

import { useState } from 'react';

interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showDots?: boolean;
}

export function Logo({ variant = 'light', size = 'md', className = '', showDots = true }: LogoProps) {
  const [imageError, setImageError] = useState(false);

  // Size classes
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12',
    xl: 'h-16'
  };

  // Logo source - try to load from public folder
  const logoSrc = variant === 'dark' 
    ? '/logos/rpgcc-logo-white.svg'
    : '/logos/rpgcc-logo.svg';

  // Text size classes
  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-5xl'
  };

  // Dot size classes
  const dotSizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5'
  };

  // If image failed to load, show text fallback
  if (imageError) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className={`font-bold tracking-tight ${variant === 'dark' ? 'text-white' : 'text-slate-800'} ${textSizeClasses[size]}`}>
          RPGCC
        </span>
        {showDots && (
          <div className="flex gap-1.5">
            <div className={`${dotSizeClasses[size]} rounded-full bg-red-500`} />
            <div className={`${dotSizeClasses[size]} rounded-full bg-orange-400`} />
            <div className={`${dotSizeClasses[size]} rounded-full bg-blue-400`} />
          </div>
        )}
      </div>
    );
  }

  // Try to load image
  return (
    <div className={className}>
      <img
        src={logoSrc}
        alt="RPGCC Logo"
        className={sizeClasses[size]}
        onError={() => setImageError(true)}
      />
    </div>
  );
}
