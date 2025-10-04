import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Users, AlertTriangle, FileText, Settings, TrendingUp, Shield, BarChart3, 
  Leaf, Briefcase, Heart, Lock, Crown, Grid3X3, Plus, X, Maximize2, Minimize2,
  Sparkles, Menu, Bell, Search, ChevronRight, Activity, Target, CheckCircle,
  AlertCircle, Clock, DollarSign, Building2, UserCheck, Calendar, TrendingDown, LogOut
} from 'lucide-react';
import { useAccountancyContext } from '../contexts/AccountancyContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { HealthScoreWidget } from '../components/accountancy/dashboard/HealthScoreWidget';
import { AdvisoryProgressWidget } from '../components/accountancy/dashboard/AdvisoryProgressWidget';
import { AlternateAuditorWidget } from '../components/accountancy/dashboard/AlternateAuditorWidget';
import { MTDCapacityWidget } from '../components/accountancy/dashboard/MTDCapacityWidget';
import { TeamWellnessWidget } from '../components/accountancy/dashboard/TeamWellnessWidget';
import { QuickActionsWidget } from '../components/accountancy/dashboard/QuickActionsWidget';

// Professional Financial Services Visual Elements
const ProfessionalPattern = () => (
  <div 
    className="absolute inset-0 pointer-events-none z-0"
    style={{
      backgroundImage: `repeating-linear-gradient(
        135deg,
        transparent,
        transparent 60px,
        rgba(59, 130, 246, 0.02) 60px,
        rgba(59, 130, 246, 0.02) 120px
      )`,
      opacity: 0.3
    }}
  />
);

const SubtleGrid = () => (
  <div 
    className="absolute inset-0 pointer-events-none z-0"
    style={{
      backgroundImage: `linear-gradient(rgba(71, 85, 105, 0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(71, 85, 105, 0.1) 1px, transparent 1px)`,
      backgroundSize: '40px 40px',
      opacity: 0.2
    }}
  />
);

// UI Components with Professional Financial Services Style
const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-primary-blue text-white border-2 border-background-slate',
    secondary: 'bg-primary-blue text-white border-2 border-background-slate',
    success: 'bg-primary-gold text-background-deepNavy border-2 border-background-slate',
    warning: 'bg-primary-gold text-background-deepNavy border-2 border-background-slate',
    danger: 'bg-primary-coral text-white border-2 border-background-slate'
  };
  
  return (
    <span className={`inline-flex items-center px-3 py-1 text-xs font-black uppercase border-2 ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Styled Card Component - FORCED WHITE BACKGROUND
const Card = ({ children, className = '' }) => (
  <div className="relative group hover:scale-[1.01] transition-transform max-w-full overflow-hidden">
    <div className="absolute -top-3 -left-3 w-full h-full border-4 border-[#ff6b35] 
                    opacity-50 group-hover:translate-x-1 group-hover:translate-y-1 
                    transition-transform z-0" />
    <div className={`relative border-4 border-[#1a2b4a] p-8 z-10 ${className}`} 
         style={{ backgroundColor: 'white', color: '#1a2b4a' }}>
      {children}
    </div>
  </div>
);

// Widget Components


// Main Dashboard Component
const AccountancyDashboard: React.FC = () => {
  const { practice, loading, subscriptionTier } = useAccountancyContext();
  const { user, signOut, hasPortalAccess } = useAuth();
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);

  // Simplified function to handle navigation to Oracle portal
  const handleNavigateToOracle = () => {
    console.log('[AccountancyDashboard] Navigating to Oracle Portal');
    
    // Check access
    if (hasPortalAccess('oracle')) {
      navigate('/dashboard');
    } else {
      console.error('[AccountancyDashboard] No access to Oracle portal');
      // Most users should have Oracle access, but just in case
      navigate('/');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/accountancy/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f1e8] flex items-center justify-center">
        <div className="text-[#1a2b4a] text-lg font-black uppercase">LOADING DASHBOARD...</div>
      </div>
    );
  }

  if (!practice) {
    return (
      <div className="min-h-screen bg-[#f5f1e8] flex items-center justify-center">
        <div className="text-[#1a2b4a] text-lg font-black uppercase">NO PRACTICE DATA FOUND</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Grid */}
      <div className="grid grid-auto-fit gap-6">
        <div className="card">
          <HealthScoreWidget healthScore={{ overall: 75, compliance: 80, team: 70, advisory: 65, financial: 78, technology: 72, lastAssessed: '2024-01-15' }} />
        </div>
        <div className="card">
          <AdvisoryProgressWidget advisoryProgress={{ currentMix: { advisory: 30, compliance: 70 }, targetMix: { advisory: 50, compliance: 50 }, monthlyTrend: [] }} />
        </div>
        <div className="card">
          <AlternateAuditorWidget />
        </div>
        <div className="card">
          <MTDCapacityWidget />
        </div>
        <div className="card">
          <TeamWellnessWidget />
        </div>
        <div className="card">
          <QuickActionsWidget />
        </div>
      </div>
    </div>
  );
};

export default AccountancyDashboard;
