
import React from 'react';
import { User } from '@supabase/supabase-js';

interface WelcomeSectionProps {
  user: User;
}

export const WelcomeSection = ({ user }: WelcomeSectionProps) => {
  return (
    <div className="text-center mb-12">
      <h1 className="text-4xl font-bold text-oracle-navy mb-4">
        Welcome back, {user.email?.split('@')[0] || 'User'}!
      </h1>
      <p className="text-xl text-oracle-navy/70">
        Your journey to business freedom continues here
      </p>
    </div>
  );
};
