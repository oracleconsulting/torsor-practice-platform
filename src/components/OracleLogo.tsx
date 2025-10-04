
import React from 'react';

interface OracleLogoProps {
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const logoVariants = {
  dark: '/lovable-uploads/16ba2299-9a8c-473c-ae3c-0f08a98300e5.png',
  light: '/lovable-uploads/94b9115e-a5a7-424c-910a-34701a9b8e97.png'
};

const sizeClasses = {
  sm: 'h-6',
  md: 'h-8',
  lg: 'h-12',
  xl: 'h-16'
};

const OracleLogo: React.FC<OracleLogoProps> = ({ variant = 'dark', size = 'lg', className = '' }) => {
  const logoPath = logoVariants[variant];
  const sizeClass = sizeClasses[size];

  return (
    <img 
      src={logoPath} 
      alt="Oracle Consulting" 
      className={`${sizeClass} w-auto ${className}`}
    />
  );
};

export default OracleLogo;
