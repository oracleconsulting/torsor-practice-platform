// File: src/archive/pages/FullRoadmapView.tsx
// This displays the full roadmap journey view with Timeline/Journey toggle
// ARCHIVED: This standalone page is no longer needed - functionality moved to dashboard

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Target, CheckCircle, Clock, Zap, TrendingUp, Award, PoundSterling, Brain, Sparkles, Building, ChevronDown, Rocket, Users, MessageSquare, Shield, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const FullRoadmapView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'timeline' | 'journey'>('timeline');

  useEffect(() => {
    const loadRoadmap = async () => {
      if (!user?.email) {
        console.log('❌ No user email found');
        return;
      }

      setLoading(true);

      try {
        // First try sessionStorage
        const storedRoadmap = sessionStorage.getItem('currentRoadmap');
        if (storedRoadmap) {
          console.log('📋 Found roadmap in sessionStorage');
          setRoadmap(JSON.parse(storedRoadmap));
          setLoading(false);
          return;
        }

        // Otherwise fetch from database
        console.log('🔍 Fetching roadmap for:', user.email);
        
        // Get user's group_id
        const { data: intakeData, error: intakeError } = await supabase
          .from('client_intake')
          .select('group_id')
          .eq('email', user.email)
          .single();

        if (intakeError || !intakeData?.group_id) {
          console.error('❌ No group_id found');
          setLoading(false);
          return;
        }

        console.log('🔑 Found group_id:', intakeData.group_id);

        // Fetch roadmap
        const { data: configData, error: configError } = await supabase
          .from('client_config')
          .select('roadmap')
          .eq('group_id', intakeData.group_id)
          .single();

        if (configError || !configData?.roadmap) {
          console.error('❌ No roadmap found');
          setLoading(false);
          return;
        }

        console.log('✅ Roadmap loaded successfully');
        setRoadmap(configData.roadmap);
      } catch (error) {
        console.error('❌ Error loading roadmap:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRoadmap();
  }, [user?.email]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your transformation journey...</p>
        </div>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800 p-8 max-w-md">
          <h2 className="text-xl font-bold text-white mb-4">No Roadmap Found</h2>
          <p className="text-gray-400 mb-6">
            It looks like your roadmap hasn't been generated yet. This usually takes a few minutes after completing Part 2.
          </p>
          <Button 
            onClick={() => navigate('/dashboard')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  // Extract personalized data
  const header = roadmap.header || {};
  const businessName = header.business_name || 'Your Business';
  const tagline = header.tagline || 'Your journey from startup struggles to sustainable success - the smart British way';
  const timeCommitment = header.time_commitment || '20 hours per week';
  const potentialROI = header.potential_roi || '£25k+';
  
  const summary = roadmap.summary || {};
  const userName = summary.userName || 'Founder';
  const currentRevenue = summary.currentRevenue || '£100k';
  const targetRevenue = summary.targetRevenue90Days || '£150k';
  
  const sprint = roadmap.three_month_sprint || {};
  const weeks = sprint.weeks || [];
  const quickWin = sprint.quick_win || roadmap.immediate_value?.this_week_quick_win || '';
  
  const boardMembers = roadmap.board_integration?.recommended_board || ['CFO', 'CTO', 'CGO'];
  
  // Calculate metrics
  const totalActions = weeks.reduce((sum: number, week: any) => sum + (week.actions?.length || 0), 0);
  const quickWins = weeks.filter((w: any) => w.priority_level === 'QUICK WIN').length;

  return (
    <div className="min-h-screen bg-black">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[url('/images/hexagonal-orange-bg.jpg')] bg-cover bg-center opacity-30" />
      <div className="fixed inset-0 bg-gradient-to-b from-black via-black/90 to-black" />

      {/* Content */}
      <div className="relative z-10">
        {/* Back Button */}
        <div className="p-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="max-w-6xl mx-auto px-6 pb-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-4">
              This page has been archived
            </h1>
            <p className="text-gray-400 mb-6">
              The full roadmap view has been consolidated into the dashboard for a better user experience.
            </p>
            <Button 
              onClick={() => navigate('/dashboard')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullRoadmapView;
