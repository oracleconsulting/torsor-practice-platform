import { useState, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { AssessmentProgress, DEFAULT_PROGRESS } from '@/types/assessmentProgress';
import { AssessmentDatabaseService } from '@/services/assessmentDatabaseService';
import { AssessmentApiService } from '@/services/assessmentApiService';
import { safeJsonToRecord } from '@/utils/assessmentUtils';
import { supabase } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { ProgressStorage } from '@/utils/progressStorage';

export const useAssessmentProgress = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<AssessmentProgress>(DEFAULT_PROGRESS);
  const [loading, setLoading] = useState(true);
  
  // Use refs to track channels and mounted state
  const channelsRef = useRef<{
    assessment?: RealtimeChannel;
    part1?: RealtimeChannel;
    part2?: RealtimeChannel;
    roadmaps?: RealtimeChannel;
  }>({});
  const isMountedRef = useRef(true);
  const subscriptionsSetupRef = useRef(false);
  const isSavingRef = useRef(false); // Track if we're currently saving

  // Track component mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadProgress = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // Load Part 1 data
      const part1Data = await AssessmentDatabaseService.checkPart1ByUserId(user.id);
      
      // Load Part 2 - FIX THE DATA EXTRACTION
      const part2Result = await AssessmentDatabaseService.checkPart2(user.id);
      console.log('[useAssessmentProgress] Part 2 raw result:', part2Result);
      
      if (part2Result.hasData && part2Result.data) {
        // CRITICAL FIX: Get the actual data from the correct path
        const part2Answers = part2Result.data.responses || part2Result.data.part2_data || {};
        
        console.log('[useAssessmentProgress] Extracted Part 2 answers:', {
          answerCount: Object.keys(part2Answers).length,
          sampleKeys: Object.keys(part2Answers).slice(0, 5)
        });
        
        // Check if roadmap is generated (this will be updated by real-time subscription)
        const roadmapGenerated = part2Result.roadmapGenerated || false;
        
        // Part 2 is complete if either the database says it's complete OR roadmap is generated
        const part2Complete = part2Result.completed || roadmapGenerated;
        
        console.log('[useAssessmentProgress] Part 2 completion logic:', {
          databaseCompleted: part2Result.completed,
          roadmapGenerated: roadmapGenerated,
          finalPart2Complete: part2Complete
        });
        
        setProgress(prev => ({
          ...prev,
          part2Complete: part2Complete,
          part2Answers: part2Answers, // <-- THIS IS THE FIX
          currentPart2Section: part2Result.data.current_section || 0,
          group_id: part2Result.data.group_id || prev.group_id
        }));
      }
      
      // Check Part 3 completion
      const part3Data = await AssessmentDatabaseService.checkPart3ByUserId(user.id);
      const part3Complete = part3Data?.completed || !!part3Data?.part3_completed_at;
      const valueAnalysisComplete = part3Data?.value_analysis_generated || !!part3Data?.data?.value_analysis_data;

      // Check validation completion
      const validationComplete = !!(part2Result.data?.validation_completed_at || part2Result.data?.validation_responses);

      // Check if roadmap is generated for Part 2 completion logic
      const roadmapGenerated = part2Result.roadmapGenerated || false;
      const part2Complete = part2Result.completed || roadmapGenerated;
      
      // Also check for roadmap in the database directly
      let roadmapData = null;
      let boardData = null;
      if (part1Data?.group_id || part2Result.data?.group_id) {
        try {
          const groupId = part1Data?.group_id || part2Result.data?.group_id;
          const { data: configData } = await supabase
            .from('client_config')
            .select('roadmap, board')
            .eq('group_id', groupId)
            .maybeSingle();
          
          if (configData) {
            roadmapData = configData.roadmap;
            boardData = configData.board;
          }
        } catch (error) {
          console.log('[useAssessmentProgress] Error checking config:', error);
        }
      }
      
      const newProgress = {
        ...DEFAULT_PROGRESS,
        part1Complete: part1Data?.completed || 
                      (part1Data?.data?.responses && Object.keys(part1Data.data.responses).length >= 15),
        part2Complete: part2Complete,
        roadmapGenerated: roadmapGenerated || !!roadmapData,
        boardGenerated: !!boardData,
        roadmap: roadmapData,
        board: boardData,
        validationComplete: validationComplete,
        part3Complete: part3Complete,
        valueAnalysisComplete: valueAnalysisComplete,
        part1Answers: part1Data?.data?.responses || {},
        part2Answers: part2Result.data?.responses || part2Result.data?.part2_data || {},
        validationAnswers: part2Result.data?.validation_responses || {},
        part3Answers: part3Data?.data?.part3_data || {},
        valueAnalysis: part3Data?.data?.value_analysis_data,
        assetScores: part3Data?.data?.asset_scores,
        valueGaps: part3Data?.data?.value_gaps,
        riskRegister: part3Data?.data?.risk_register,
        actionPlan: part3Data?.data?.action_plan,
        group_id: part1Data?.group_id || part2Result.data?.group_id,
        fitMessage: part1Data?.data?.fit_message,
      };
      
      console.log('[useAssessmentProgress] Final progress state:', {
        part2Complete: newProgress.part2Complete,
        roadmapGenerated: newProgress.roadmapGenerated,
        roadmapData: !!roadmapData,
        boardData: !!boardData,
        group_id: newProgress.group_id
      });

      setProgress(newProgress);
      
      // Clear any invalid localStorage data
      if (!part2Result.completed && localStorage.getItem('oracle_assessment_progress')) {
        const stored = JSON.parse(localStorage.getItem('oracle_assessment_progress') || '{}');
        if (stored.part2Complete) {
          stored.part2Complete = false;
          localStorage.setItem('oracle_assessment_progress', JSON.stringify(stored));
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
  }, [user?.id]);

  // Force refresh when user changes or on mount
  useEffect(() => {
    if (user?.id) {
      // Clear any cached progress data and reload
      setProgress(DEFAULT_PROGRESS);
      loadProgress();
    }
  }, [user?.id]);

  // Cleanup all channels on unmount
  useEffect(() => {
    return () => {
      console.log('Cleaning up all realtime channels');
      
      // Clean up all channels when component unmounts
      Object.entries(channelsRef.current).forEach(([key, channel]) => {
        if (channel) {
          console.log(`Removing ${key} channel`);
          supabase.removeChannel(channel);
        }
      });
      
      channelsRef.current = {};
      subscriptionsSetupRef.current = false;
    };
  }, []);

  // Real-time subscription for board/roadmap updates
  useEffect(() => {
    if (!progress.group_id || !isMountedRef.current || subscriptionsSetupRef.current) return;

    console.log('Setting up real-time subscription for:', progress.group_id);
    
    // Clean up existing assessment channel if any
    if (channelsRef.current.assessment) {
      console.log('Removing existing assessment channel');
      supabase.removeChannel(channelsRef.current.assessment);
      channelsRef.current.assessment = undefined;
    }
    
    // Subscribe to both client_config and roadmaps tables
    const configChannel = supabase
      .channel(`config-${progress.group_id}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'client_config',
          filter: `group_id=eq.${progress.group_id}`
        },
        (payload) => {
          if (!isMountedRef.current) return;
          
          console.log('Real-time config update received:', payload);
          
          // Update progress with new board/roadmap status
          setProgress(prev => ({
            ...prev,
            boardGenerated: !!payload.new.board,
            roadmapGenerated: !!payload.new.roadmap,
            boardRecommendation: payload.new.board,
            roadmap: payload.new.roadmap,
            // If roadmap is generated, Part 2 should be considered complete
            part2Complete: prev.part2Complete || !!payload.new.roadmap
          }));
          
          // Show toast notification
          if (payload.new.board && !progress.boardGenerated) {
            toast('🎉 Your AI Board is Ready!', {
              description: 'Check your dashboard to meet your advisors.'
            });
          }
          
          if (payload.new.roadmap && !progress.roadmapGenerated) {
            toast('🗺️ Your Roadmap is Ready!', {
              description: 'Your personalized 90-day plan is now available.'
            });
          }
        }
      )
      .subscribe();

    const roadmapsChannel = supabase
      .channel(`roadmaps-${progress.group_id}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'roadmaps',
          filter: `group_id=eq.${progress.group_id}`
        },
        (payload) => {
          if (!isMountedRef.current) return;
          
          console.log('Real-time roadmaps update received:', payload);
          
          // Update progress with new roadmap status
          setProgress(prev => ({
            ...prev,
            roadmapGenerated: true,
            roadmap: payload.new,
            // If roadmap is generated, Part 2 should be considered complete
            part2Complete: prev.part2Complete || true
          }));
          
          // Show toast notification
          if (!progress.roadmapGenerated) {
            toast('🗺️ Your Roadmap is Ready!', {
              description: 'Your personalized 90-day plan is now available.'
            });
          }
        }
      )
      .subscribe();

    channelsRef.current.assessment = configChannel;
    channelsRef.current.roadmaps = roadmapsChannel;
    subscriptionsSetupRef.current = true;

    return () => {
      if (channelsRef.current.assessment) {
        console.log('Cleaning up assessment subscription');
        supabase.removeChannel(channelsRef.current.assessment);
        channelsRef.current.assessment = undefined;
      }
      if (channelsRef.current.roadmaps) {
        console.log('Cleaning up roadmaps subscription');
        supabase.removeChannel(channelsRef.current.roadmaps);
        channelsRef.current.roadmaps = undefined;
      }
      subscriptionsSetupRef.current = false;
    };
  }, [progress.group_id]); // Only depend on group_id

  // Separate effect for Part 1 and Part 2 subscriptions
  useEffect(() => {
    if (!progress.group_id || !isMountedRef.current) return;

    const setupSubscriptions = async () => {
      // Add a small delay to ensure channels are cleaned up
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('Setting up real-time subscriptions for Part 1 and Part 2');
      
      // Clean up existing channels
      if (channelsRef.current.part1) {
        console.log('Removing existing part1 channel');
        await supabase.removeChannel(channelsRef.current.part1);
        channelsRef.current.part1 = undefined;
      }
      if (channelsRef.current.part2) {
        console.log('Removing existing part2 channel');
        await supabase.removeChannel(channelsRef.current.part2);
        channelsRef.current.part2 = undefined;
      }
      
      // Subscription for Part 1 updates
      const part1Channel = supabase
        .channel(`part1-${progress.group_id}-${Date.now()}`) // Add timestamp
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'client_intake',
          filter: `group_id=eq.${progress.group_id}`
        }, (payload) => {
          if (!isMountedRef.current) return;
          
          console.log('Part 1 update:', payload);
          
          // Update local state with new Part 1 data
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newData = payload.new;
            setProgress(prev => ({
              ...prev,
              part1Answers: safeJsonToRecord(newData.responses),
              part1Complete: !!newData.responses && Object.keys(newData.responses).length > 0,
              fitMessage: newData.fit_message || prev.fitMessage
            }));
          }
        })
        .subscribe();

      // Subscription for Part 2 updates
      const part2Channel = supabase
        .channel(`part2-${progress.group_id}-${Date.now()}`) // Add timestamp
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'client_intake_part2',
          filter: `group_id=eq.${progress.group_id}`
        }, (payload) => {
          if (!isMountedRef.current) return;
          
          console.log('Part 2 update:', payload);
          
          // Skip updates if we're currently saving to prevent race conditions
          if (isSavingRef.current) {
            console.log('Skipping Part 2 update - currently saving');
            return;
          }
          
          // Update local state with new Part 2 data
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newData = payload.new;
            setProgress(prev => ({
              ...prev,
              part2Answers: safeJsonToRecord(newData.responses),
              part2Complete: newData.responses && Object.keys(newData.responses).length >= 55,
              currentPart2Section: newData.current_section || prev.currentPart2Section // Preserve current section
            }));
          }
        })
        .subscribe();

      // Store channel references
      channelsRef.current.part1 = part1Channel;
      channelsRef.current.part2 = part2Channel;
    };

    setupSubscriptions();

    return () => {
      console.log('Cleaning up Part 1 and Part 2 subscriptions');
      
      if (channelsRef.current.part1) {
        supabase.removeChannel(channelsRef.current.part1);
        channelsRef.current.part1 = undefined;
      }
      
      if (channelsRef.current.part2) {
        supabase.removeChannel(channelsRef.current.part2);
        channelsRef.current.part2 = undefined;
      }
    };
  }, [progress.group_id]);

  // Include all the other methods (savePart1Answer, savePart2Answer, etc.)
  // ... rest of the original methods go here ...

  const savePart1Answer = async (questionId: string, answer: any, newGroupId?: string) => {
    if (!user?.id) return;

    setProgress(prev => ({
      ...prev,
      part1Answers: {
        ...prev.part1Answers,
        [questionId]: answer
      },
      group_id: newGroupId || prev.group_id
    }));

    try {
      await AssessmentDatabaseService.savePart1(
        user.id,
        user.email || '',
        {
          ...progress.part1Answers,
          [questionId]: answer
        },
        newGroupId || progress.group_id
      );
    } catch (error) {
      console.error('Error saving Part 1 answer:', error);
    }
  };

  const savePart2Answer = async (fieldName: string, value: any) => {
    if (!user?.id || !progress.group_id) return;

    setProgress(prev => ({
      ...prev,
      part2Answers: {
        ...prev.part2Answers,
        [fieldName]: value
      }
    }));

    try {
      await AssessmentDatabaseService.savePart2(
        user.id,
        progress.group_id,
        {
          ...progress.part2Answers,
          [fieldName]: value
        }
      );
    } catch (error) {
      console.error('Error saving Part 2 answer:', error);
    }
  };

  const savePart2Progress = async (responses: Record<string, any>) => {
    if (!user?.id || !progress.group_id) return;
    
    isSavingRef.current = true;
    try {
      console.log('[useAssessmentProgress] Saving Part 2 progress:', {
        count: Object.keys(responses).length,
        sample: Object.keys(responses).slice(0, 3)
      });
      
      await AssessmentDatabaseService.savePart2(
        user.id,
        progress.group_id,
        responses
      );
      
      setProgress(prev => ({
        ...prev,
        part2Answers: responses
      }));
      
      console.log('[useAssessmentProgress] Part 2 progress saved successfully');
    } catch (error) {
      console.error('Error saving Part 2 progress:', error);
    } finally {
      // Small delay to ensure the save operation is complete before allowing updates
      setTimeout(() => {
        isSavingRef.current = false;
      }, 200);
    }
  };

  const updateProgress = (updates: Partial<AssessmentProgress>) => {
    setProgress(prev => ({
      ...prev,
      ...updates
    }));
  };

  const checkRoadmapStatus = async () => {
    if (!user?.id) return;

    try {
      const status = await AssessmentDatabaseService.checkRoadmapStatusByUserId(user.id);
      if (status.roadmapExists || status.boardExists) {
        setProgress(prev => ({
          ...prev,
          roadmapGenerated: status.roadmapExists,
          boardGenerated: status.boardExists,
          roadmap: status.roadmapData,
          board: status.boardData
        }));
      }
      return status;
    } catch (error) {
      console.error('Error checking roadmap status:', error);
      return null;
    }
  };

  const recoverPart2Data = async () => {
    if (!user?.id || !progress.group_id) return;

    try {
      const { data } = await AssessmentDatabaseService.savePart2Alternative(
        user.id,
        progress.group_id,
        progress.part2Answers
      );
      return data;
    } catch (error) {
      console.error('Error recovering Part 2 data:', error);
      return null;
    }
  };

  const refreshProgress = async () => {
    console.log('[useAssessmentProgress] Force refreshing progress...');
    setLoading(true);
    setProgress(DEFAULT_PROGRESS);
    await loadProgress();
  };

  const completePart1 = async () => {
    console.log('[useAssessmentProgress] completePart1 called');
    console.log('[useAssessmentProgress] User ID:', user?.id);
    console.log('[useAssessmentProgress] Current answers:', progress.part1Answers);
    
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('[useAssessmentProgress] Saving Part 1 to database...');
      
      const result = await AssessmentDatabaseService.savePart1(
        user.id, 
        user.email || '',
        progress.part1Answers,
        progress.group_id
      );
      
      console.log('[useAssessmentProgress] Save result:', result);
      
      setProgress({
        ...progress,
        part1Complete: true,
        group_id: result.group_id,
        fitMessage: result.fit_message || progress.fitMessage
      });

      console.log('[useAssessmentProgress] Part 1 completed successfully');
      console.log('[useAssessmentProgress] Group ID:', result.group_id);

      return {
        success: true,
        data: result
      };
    } catch (error: any) {
      console.error('[useAssessmentProgress] Error completing Part 1:', error);
      throw error;
    }
  };

  const completePart2 = async (answersToSave: Record<string, any>) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('Completing Part 2 with answers:', answersToSave);
      
      // Use user.id as primary identifier, group_id as secondary
      await AssessmentDatabaseService.savePart2(user.id, progress.group_id || '', answersToSave);
      
      // API call can still use group_id for now (backend compatibility)
      if (progress.group_id) {
        await AssessmentApiService.completeAssessment(progress.group_id);
      }
      
      setProgress({
        ...progress,
        part2Complete: true,
        part2Answers: answersToSave
      });

      return {
        success: true
      };
    } catch (error: any) {
      console.error('Error completing Part 2:', error);
      throw error;
    }
  };

  const clearAllData = () => {
    console.log('Clearing all assessment data');
    setProgress(DEFAULT_PROGRESS);
    
    try {
      localStorage.removeItem('assessmentProgress');
      localStorage.removeItem('oracle_assessment_progress');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  };

  return {
    progress,
    savePart1Answer,
    savePart2Answer,
    savePart2Progress,
    updateProgress,
    completePart1,
    completePart2,
    clearAllData,
    checkRoadmapStatus,
    recoverPart2Data,
    loading,
    onRefresh: refreshProgress
  };
};