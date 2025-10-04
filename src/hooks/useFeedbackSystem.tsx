// File: src/hooks/useFeedbackSystem.tsx

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface FeedbackRequest {
  id: string;
  feedback_type: string;
  questions: any[];
  status: 'pending' | 'completed' | 'skipped';
  context_data?: any;
}

interface ValidationResult {
  status: 'complete' | 'needs_info' | 'under_review';
  missingFields?: any[];
}

export function useFeedbackSystem(groupId: string) {
  const [pendingFeedback, setPendingFeedback] = useState<FeedbackRequest[]>([]);
  const [activeFeedback, setActiveFeedback] = useState<FeedbackRequest | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  // Check for pending feedback requests
  useEffect(() => {
    if (!groupId) return;

    const checkPendingFeedback = async () => {
      const { data, error } = await supabase
        .from('feedback_requests')
        .select('*')
        .eq('group_id', groupId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPendingFeedback(data);
        // Set the most recent as active if none is active
        if (data.length > 0 && !activeFeedback) {
          setActiveFeedback(data[0]);
        }
      }
    };

    checkPendingFeedback();

    // Subscribe to new feedback requests
    const subscription = supabase
      .channel(`feedback_${groupId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'feedback_requests',
        filter: `group_id=eq.${groupId}`
      }, (payload) => {
        setPendingFeedback(prev => [payload.new as FeedbackRequest, ...prev]);
        if (!activeFeedback) {
          setActiveFeedback(payload.new as FeedbackRequest);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [groupId, activeFeedback]);

  // Submit feedback response
  const submitFeedback = useCallback(async (feedbackId: string, responses: Record<string, any>) => {
    try {
      const response = await fetch(`https://oracle-api-server-production.up.railway.app/api/feedback/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          feedback_id: feedbackId,
          group_id: groupId,
          responses
        })
      });

      if (!response.ok) throw new Error('Failed to submit feedback');

      const result = await response.json();

      // Remove from pending and clear active
      setPendingFeedback(prev => prev.filter(f => f.id !== feedbackId));
      setActiveFeedback(null);

      // Show next feedback if available
      const remaining = pendingFeedback.filter(f => f.id !== feedbackId);
      if (remaining.length > 0) {
        setActiveFeedback(remaining[0]);
      }

      toast.success('Thank you for your feedback!');
      
      return result;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
      throw error;
    }
  }, [groupId, pendingFeedback]);

  // Skip feedback
  const skipFeedback = useCallback(async (feedbackId: string) => {
    try {
      await supabase
        .from('feedback_requests')
        .update({ status: 'skipped' })
        .eq('id', feedbackId);

      setPendingFeedback(prev => prev.filter(f => f.id !== feedbackId));
      setActiveFeedback(null);

      // Show next if available
      const remaining = pendingFeedback.filter(f => f.id !== feedbackId);
      if (remaining.length > 0) {
        setActiveFeedback(remaining[0]);
      }
    } catch (error) {
      console.error('Error skipping feedback:', error);
    }
  }, [pendingFeedback]);

  // Validate assessment data
  const validateAssessmentData = useCallback(async (part1Data: any, part2Data?: any) => {
    setIsValidating(true);
    try {
      const response = await fetch(`https://oracle-api-server-production.up.railway.app/api/validate-assessment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          group_id: groupId,
          part1_data: part1Data,
          part2_data: part2Data
        })
      });

      if (!response.ok) throw new Error('Validation failed');

      const result = await response.json();
      setValidationResult(result);
      
      return result;
    } catch (error) {
      console.error('Error validating assessment:', error);
      toast.error('Failed to validate assessment data');
      throw error;
    } finally {
      setIsValidating(false);
    }
  }, [groupId]);

  // Submit missing information
  const submitMissingInfo = useCallback(async (responses: Record<string, any>) => {
    try {
      const response = await fetch(`https://oracle-api-server-production.up.railway.app/api/update-missing-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          group_id: groupId,
          updates: responses
        })
      });

      if (!response.ok) throw new Error('Failed to update information');

      toast.success('Information updated successfully!');
      
      // Clear validation result
      setValidationResult(null);
      
      return await response.json();
    } catch (error) {
      console.error('Error submitting missing info:', error);
      toast.error('Failed to update information');
      throw error;
    }
  }, [groupId]);

  // Request regeneration after info update
  const requestRegeneration = useCallback(async (type: 'board' | 'roadmap') => {
    try {
      const response = await fetch(`https://oracle-api-server-production.up.railway.app/api/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          group_id: groupId,
          regeneration_type: type
        })
      });

      if (!response.ok) throw new Error('Failed to request regeneration');

      toast.success(`Regenerating your ${type}...`);
      
      return await response.json();
    } catch (error) {
      console.error('Error requesting regeneration:', error);
      toast.error('Failed to regenerate');
      throw error;
    }
  }, [groupId]);

  return {
    // Feedback state
    pendingFeedback,
    activeFeedback,
    hasPendingFeedback: pendingFeedback.length > 0,
    
    // Validation state
    isValidating,
    validationResult,
    needsMoreInfo: validationResult?.status === 'needs_info',
    missingFields: validationResult?.missingFields || [],
    
    // Actions
    submitFeedback,
    skipFeedback,
    validateAssessmentData,
    submitMissingInfo,
    requestRegeneration
  };
}
