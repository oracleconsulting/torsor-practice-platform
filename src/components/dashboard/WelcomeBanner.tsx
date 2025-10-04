// File: src/components/dashboard/WelcomeBanner.tsx

import React from 'react';
import { Button } from '@/components/ui/button';

interface WelcomeBannerProps {
  email: string;
  tier: string;
  isAdminView?: boolean;
  clientEmail?: string;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ 
  email, 
  tier,
  isAdminView,
  clientEmail 
}) => {
  // Extract just the name part before @ symbol
  const displayName = email.split('@')[0];
  
  return (
    <div className="relative mb-8 p-8 rounded-2xl overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/10 to-blue-900/20"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"></div>
      
      {/* Content */}
      <div className="relative z-10 text-center">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
          Welcome back, {displayName}!
        </h1>
        <p className="text-xl text-gray-300 mb-6">
          Your personal business transformation dashboard
        </p>
        
        <Button 
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-3"
        >
          Continue Your Journey
        </Button>
      </div>
    </div>
  );
};
