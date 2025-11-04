/**
 * Comprehensive VARK Assessment Page
 * Handles assessment flow, results, and database persistence
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import VARKAssessmentNew from '@/components/accountancy/team/VARKAssessmentNew';
import VARKResults from '@/components/accountancy/team/VARKResults';
import { type VARKProfile } from '@/data/varkQuestions';
import { onAssessmentComplete } from '@/lib/api/gamification/hooks';

const VARKAssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const [teamMemberId, setTeamMemberId] = useState<string>('');
  const [teamMemberName, setTeamMemberName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [profile, setProfile] = useState<VARKProfile | null>(null);

  // Fetch member ID and info
  useEffect(() => {
    const fetchMemberInfo = async () => {
      const memberIdParam = searchParams.get('member_id');
      const memberNameParam = searchParams.get('member_name');
      
      if (memberIdParam) {
        // If member_id is provided in URL, use it
        setTeamMemberId(memberIdParam);
        if (memberNameParam) {
          setTeamMemberName(memberNameParam);
        }
        setLoading(false);
      } else if (user?.id) {
        // Fetch practice_members ID based on auth user ID
        console.log('[VARKAssessmentPage] Fetching practice_member ID for user:', user.id);
        try {
          const { data, error } = await supabase
            .from('practice_members')
            .select('id, name')
            .eq('user_id', user.id)
            .single();

          if (error) {
            console.error('[VARKAssessmentPage] Error fetching member ID:', error);
            toast({
              title: 'Error',
              description: 'Could not load your profile. Please try again.',
              variant: 'destructive',
            });
          } else if (data) {
            console.log('[VARKAssessmentPage] Found practice_member:', data);
            setTeamMemberId(data.id);
            setTeamMemberName(data.name || 'Team Member');
          }
        } catch (err) {
          console.error('[VARKAssessmentPage] Exception:', err);
        }
        setLoading(false);
      }
    };

    fetchMemberInfo();
  }, [user, searchParams, toast]);

  const handleAssessmentComplete = async (varkProfile: VARKProfile) => {
    console.log('[VARKAssessmentPage] Assessment complete:', varkProfile);
    
    // Save to database
    try {
      const { error } = await supabase
        .from('learning_preferences')
        .upsert({
          team_member_id: teamMemberId,
          visual_score: varkProfile.scores.visual,
          auditory_score: varkProfile.scores.auditory,
          read_write_score: varkProfile.scores.readWrite,
          kinesthetic_score: varkProfile.scores.kinesthetic,
          visual_percentage: varkProfile.percentages.visual,
          auditory_percentage: varkProfile.percentages.auditory,
          read_write_percentage: varkProfile.percentages.readWrite,
          kinesthetic_percentage: varkProfile.percentages.kinesthetic,
          learning_type: varkProfile.learningType,
          dominant_styles: varkProfile.dominantStyles,
          responses: varkProfile.scores, // Store full scores as JSONB
          assessment_date: new Date().toISOString()
        }, {
          onConflict: 'team_member_id'
        });

      if (error) {
        console.error('[VARKAssessmentPage] Error saving preferences:', error);
        toast({
          title: 'Error',
          description: 'Failed to save your learning preferences. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      // Also update practice_members to mark VARK as completed
      const { error: updateError } = await supabase
        .from('practice_members')
        .update({
          vark_assessment_completed: true,
          vark_completed_at: new Date().toISOString(),
          vark_result: {
            visual: varkProfile.percentages.visual,
            auditory: varkProfile.percentages.auditory,
            reading: varkProfile.percentages.readWrite,
            kinesthetic: varkProfile.percentages.kinesthetic,
            primaryStyle: varkProfile.learningType,
            dominantStyles: varkProfile.dominantStyles
          }
        })
        .eq('id', teamMemberId);

      if (updateError) {
        console.error('[VARKAssessmentPage] Error updating member status:', updateError);
      }

      console.log('[VARKAssessmentPage] VARK profile saved successfully');
      
      // 🎮 Trigger gamification: Assessment complete
      onAssessmentComplete(teamMemberId, 'vark').catch(err => 
        console.error('[VARKAssessmentPage] Gamification error:', err)
      );
      
      // Show results
      setProfile(varkProfile);
      setShowResults(true);
      
    } catch (err) {
      console.error('[VARKAssessmentPage] Exception saving profile:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleResultsContinue = async () => {
    console.log('[VARKAssessmentPage] Results viewed, checking next steps...');
    
    // Check if password setup is needed
    try {
      const { data: memberData, error } = await supabase
        .from('practice_members')
        .select('needs_password_setup, user_id')
        .eq('id', teamMemberId)
        .single();

      if (error) {
        console.error('[VARKAssessmentPage] Error checking password setup status:', error);
      }

      const needsPassword = memberData?.needs_password_setup || false;
      const hasUserId = !!memberData?.user_id;

      console.log('[VARKAssessmentPage] Password setup needed:', needsPassword, 'Has user_id:', hasUserId);

      // Show completion message
      toast({
        title: 'Onboarding Complete! 🎉',
        description: needsPassword && !hasUserId 
          ? 'Next, please set up your password to access the portal.'
          : 'Your profile is complete. Welcome to the team!',
      });

      // Navigate based on status
      if (needsPassword && !hasUserId) {
        // TODO: Navigate to password setup page
        setTimeout(() => {
          navigate('/team');
        }, 2000);
      } else {
        // Navigate to dashboard
        setTimeout(() => {
          navigate('/team');
        }, 2000);
      }
    } catch (err) {
      console.error('[VARKAssessmentPage] Exception:', err);
      setTimeout(() => {
        navigate('/team');
      }, 2000);
    }
  };

  const handleCancel = () => {
    navigate('/team');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (!teamMemberId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-lg">
          <p className="text-gray-600 mb-4">Unable to load assessment. Please try again.</p>
          <button
            onClick={() => navigate('/team')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (showResults && profile) {
    return (
      <VARKResults
        profile={profile}
        memberName={teamMemberName}
        onContinue={handleResultsContinue}
      />
    );
  }

  return (
    <VARKAssessmentNew
      teamMemberId={teamMemberId}
      onComplete={handleAssessmentComplete}
      onCancel={handleCancel}
    />
  );
};

export default VARKAssessmentPage;
