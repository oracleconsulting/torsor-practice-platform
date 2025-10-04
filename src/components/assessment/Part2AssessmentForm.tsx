import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAssessmentProgress } from '@/hooks/useAssessmentProgress';
import { AssessmentDatabaseService } from '@/services/assessmentDatabaseService';
import { AssessmentApiService } from '@/services/assessmentApiService';
import { part2Sections } from '@/data/part2Questions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Save, Loader2, CheckCircle, Check, AlertCircle, RefreshCw } from 'lucide-react';
import debounce from 'lodash/debounce';
import { createPortal } from 'react-dom';

interface Part2Question {
  id: string | number;
  question: string;
  type: string;
  fieldName: string;
  required?: boolean;
  options?: string[];
  helperText?: string;
  description?: string;
  min?: number;
  max?: number;
  matrixItems?: Array<{ label: string; fieldName: string }>;
  conditionalQuestions?: Array<{
    id: string;
    question: string;
    type: string;
    fieldName: string;
    showWhen: string;
    options?: string[];
    hasOther?: boolean;
  }>;
  hasOther?: boolean;
  conditional?: any; // Add this to support conditional questions
}

interface Part2Section {
  title: string;
  shortTitle: string;
  description: string;
  questions: Part2Question[];
}

interface Part2AssessmentFormProps {
  currentSectionIndex?: number;
  singleSectionMode?: boolean;
  onResponsesUpdate?: (responses: Record<string, any>) => void;
  initialResponses?: Record<string, any>;
}

export const Part2AssessmentForm = ({ 
  currentSectionIndex: propCurrentSectionIndex,
  singleSectionMode = false,
  onResponsesUpdate,
  initialResponses = {}
}: Part2AssessmentFormProps = {}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { progress, savePart2Progress, savePart2Answer, updateProgress, completePart2, checkRoadmapStatus } = useAssessmentProgress();

  // In single section mode, always use the prop. Otherwise, use internal state.
  const [internalSectionIndex, setInternalSectionIndex] = useState(0);
  const currentSectionIndex = singleSectionMode && propCurrentSectionIndex !== undefined 
    ? propCurrentSectionIndex 
    : internalSectionIndex;
    
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // NEW: Sync internal state when prop changes
  useEffect(() => {
    if (propCurrentSectionIndex !== undefined && propCurrentSectionIndex !== currentSectionIndex) {
      setInternalSectionIndex(propCurrentSectionIndex);
    }
  }, [propCurrentSectionIndex]);

  // NEW: Load saved section index from progress (only once)
  useEffect(() => {
    if (!singleSectionMode && progress.currentPart2Section !== undefined) {
      console.log(`[Part2Form] Loading saved section index: ${progress.currentPart2Section}`);
      setInternalSectionIndex(progress.currentPart2Section);
    }
  }, [progress.currentPart2Section, singleSectionMode]);
  
  // NEW: Polling and progress state
  const [isPolling, setIsPolling] = useState(false);
  const [pollingMessage, setPollingMessage] = useState('');
  const [pollingProgress, setPollingProgress] = useState(0);
  const [showManualCheck, setShowManualCheck] = useState(false);
  const [submissionStage, setSubmissionStage] = useState('');

  // Memoize the current section to prevent unnecessary re-renders
  const currentSection = useMemo(() => {
    return part2Sections[currentSectionIndex] || null;
  }, [currentSectionIndex]);

  // Use a ref to track the latest responses for debouncedSave
  const responsesRef = useRef(responses);
  responsesRef.current = responses;

  // Create debounced save function with 2-second debounce
  const debouncedSave = useCallback(
    debounce(async (userId: string, groupId: string) => {
      try {
        // Use the ref to get the latest responses
        const currentResponses = responsesRef.current;
        
        await AssessmentDatabaseService.updatePart2(userId, groupId, { 
          responses: currentResponses 
        });
        
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 2000), // 2 second debounce
    []
  );

  // Auto-save on response changes
  useEffect(() => {
    if (progress.group_id && Object.keys(responses).length > 0) {
      debouncedSave(user.id, progress.group_id);
    }
  }, [responses, progress.group_id, debouncedSave, user.id]);

  // Handle response changes with immediate save
  const handleResponseChange = useCallback(async (fieldName: string, value: any) => {
    console.log(`[Part2Form] Response change: ${fieldName} = ${value}`);
    
    // Update local state
    const newResponses = {
      ...responses,
      [fieldName]: value
    };
    setResponses(newResponses);
    
    // Update parent component
    if (onResponsesUpdate) {
      onResponsesUpdate(newResponses);
    }
    
    // Debug logging for matrix questions
    if (fieldName.startsWith('rating_')) {
      console.log(`[Part2Form] Matrix item response saved: ${fieldName} = ${value}`);
      console.log(`[Part2Form] Current responses for matrix items:`, 
        Object.entries(newResponses).filter(([key]) => key.startsWith('rating_'))
      );
    }
    
    // Save to database immediately (with debouncing)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('[Part2Form] Auto-saving responses:', {
          count: Object.keys(newResponses).length,
          sample: Object.entries(newResponses).slice(0, 3),
          userId: user?.id,
          groupId: progress.group_id
        });
        await savePart2Progress(newResponses);
        console.log('[Part2Form] Auto-saved responses successfully');
      } catch (error) {
        console.error('[Part2Form] Error auto-saving:', error);
      }
    }, 500); // Reduced to 500ms for faster saving
    
    // Handle conditional questions
    const sections = part2Sections as any[];
    const question = sections
      .flatMap(s => s.questions)
      .find(q => q.fieldName === fieldName);
      
    if (question?.type === 'conditional' && question.conditionalQuestions) {
      const subQuestions = question.conditionalQuestions.filter(
        sq => sq.showWhen === value
      );
      
      if (subQuestions.length > 0) {
        const firstSubField = subQuestions[0].fieldName;
        if (!responses[firstSubField]) {
          setResponses(prev => ({
            ...prev,
            [firstSubField]: ''
          }));
        }
      }
    }
  }, [responses, onResponsesUpdate, savePart2Progress]);

  // Emergency data recovery on mount
  useEffect(() => {
    // Initialize with initialResponses if provided
    if (initialResponses && Object.keys(initialResponses).length > 0) {
      console.log('[Part2Form] Initializing with initialResponses:', initialResponses);
      setResponses(initialResponses);
    } else if (progress.part2Answers && Object.keys(progress.part2Answers).length > 0) {
      console.log('[Part2Form] Initializing with saved responses:', progress.part2Answers);
      setResponses(progress.part2Answers);
    } else {
      console.log('[Part2Form] No saved responses found, starting fresh');
      setResponses({});
    }
  }, [initialResponses, progress.part2Answers]);

  // Enhanced data loading with progress monitoring
  useEffect(() => {
    console.log('[Part2Form] Component mounted with progress:', {
      hasProgress: !!progress,
      hasPart2Answers: !!progress?.part2Answers,
      answerCount: progress?.part2Answers ? Object.keys(progress.part2Answers).length : 0
    });
    
    // Load saved answers if available
    if (progress?.part2Answers && Object.keys(progress.part2Answers).length > 0) {
      console.log('[Part2Form] Loading saved answers:', progress.part2Answers);
      setResponses(progress.part2Answers);
    }
  }, [progress?.part2Answers]);

  // Clear stale data on mount
  useEffect(() => {
    // Clear any stale localStorage data
    localStorage.removeItem('part2Responses');
    localStorage.removeItem('assessmentResponses');
    
    // REMOVED: Don't clear responses just because part2Complete is false
    // This was preventing saved progress from being loaded
  }, []);

  // Ensure sections are loaded
  useEffect(() => {
    if (!part2Sections || part2Sections.length === 0) {
      console.error('Part 2 sections not loaded!');
    } else {
      console.log(`Part 2 sections loaded: ${part2Sections.length} sections`);
    }
  }, []);

  // Initialize Part 2 assessment
  useEffect(() => {
    const initializeForm = async () => {
      
      if (!user?.id) {
        setIsInitialized(true);
        return;
      }
  
      // If group_id is missing, wait a bit and check again
      if (!progress.group_id) {
        // Set a timeout to retry after a short delay
        const retryTimeout = setTimeout(() => {
          if (progress.group_id) {
            initializeForm();
          } else {
            setIsInitialized(true);
          }
        }, 1000);
        
        return () => clearTimeout(retryTimeout);
      }
  
      try {
        // Initialize Part 2 in the database if it doesn't exist
        try {
          await AssessmentDatabaseService.initializePart2(user.id, progress.group_id);
        } catch (initError) {
          console.warn('[Part2Form] Initialization failed, but continuing:', initError);
          // Don't block the form if initialization fails
        }
        
        // Section index is now handled by separate useEffect to prevent re-initialization
  
        // FIXED: Load existing responses regardless of completion status
        if (progress.part2Answers && Object.keys(progress.part2Answers).length > 0) {
          
          // Filter out any invalid responses before setting state
          const validResponses: Record<string, any> = {};
          
          Object.entries(progress.part2Answers).forEach(([key, value]) => {
            // Skip empty or invalid values
            if (value === undefined || value === null || value === '') return;
            if (typeof value === 'string' && value.trim() === '') return;
            if (Array.isArray(value) && value.length === 0) return;
            
            // Keep valid responses
            validResponses[key] = value;
          });
  
          console.log('[Part2Form] Loading valid responses:', {
            total: Object.keys(progress.part2Answers).length,
            valid: Object.keys(validResponses).length,
            sample: Object.keys(validResponses).slice(0, 3)
          });
          
          setResponses(validResponses);
        } else {
          // Start with completely empty responses if no saved data
          console.log('[Part2Form] No saved responses found, starting fresh');
          setResponses({});
        } 
  
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing Part 2:', error);
        toast.error('Failed to initialize assessment. Please try again.');
        setIsInitialized(true); // Still set as initialized to prevent infinite loop
      }
    };

    initializeForm();
  }, [user?.id, progress.group_id, singleSectionMode]); // Removed progress.currentPart2Section to prevent re-initialization

  // Handle section navigation
  const handleSectionChange = useCallback(async (newIndex: number) => {
    if (newIndex < 0 || newIndex >= part2Sections.length) return;
    
    console.log(`[Part2Form] Changing section from ${currentSectionIndex} to ${newIndex}`);
    
    // Wait for any pending save to complete
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      // Wait a bit for the save to complete
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Save current responses before changing sections
    if (user?.id && progress.group_id && Object.keys(responses).length > 0) {
      try {
        console.log('[Part2Form] Saving current responses before section change:', {
          count: Object.keys(responses).length,
          sample: Object.entries(responses).slice(0, 3)
        });
        await savePart2Progress(responses);
        console.log('[Part2Form] Responses saved before section change');
      } catch (error) {
        console.error('[Part2Form] Error saving responses before section change:', error);
      }
    }
    
    // Save current section index to database
    if (user?.id && progress.group_id) {
      try {
        await AssessmentDatabaseService.updatePart2(user.id, progress.group_id, {
          current_section: newIndex
        });
        console.log(`[Part2Form] Saved section index: ${newIndex}`);
      } catch (error) {
        console.error('[Part2Form] Error saving section index:', error);
      }
    }
    
    if (!singleSectionMode) {
      setInternalSectionIndex(newIndex);
    }
    
    // Scroll to top when changing sections
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [singleSectionMode, currentSectionIndex, user?.id, progress.group_id, responses, savePart2Progress]);

  // Manual save function
  const handleManualSave = async () => {
    if (!user?.id || !progress.group_id) return;
    
    try {
      await savePart2Progress(responses);
      setLastSaved(new Date());
      toast.success('Progress saved successfully!');
    } catch (error) {
      console.error('Error saving progress:', error);
      toast.error('Failed to save progress. Please try again.');
    }
  };

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Manual check function
  const handleManualCheck = async () => {
    if (!user?.id || !progress.group_id) return;
    
    setIsPolling(true);
    setPollingMessage('Checking assessment status...');
    
    try {
      const status = await checkRoadmapStatus();
      
      if (status?.roadmapExists || status?.boardExists) {
        toast.success('Assessment completed! Redirecting...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setShowManualCheck(true);
        toast.info('Assessment is still being processed. Please check back later.');
      }
    } catch (error) {
      console.error('Error checking status:', error);
      toast.error('Failed to check status. Please try again.');
    } finally {
      setIsPolling(false);
      setPollingMessage('');
    }
  };

  // Force refresh Part 2 completion status
  const forceRefreshPart2Status = async () => {
    if (!user?.id || !progress.group_id) return;
    
    try {
      console.log('[Part2Form] Force refreshing Part 2 completion status...');
      
      // Get the current Part 2 data
      const part2Data = await AssessmentDatabaseService.checkPart2(user.id);
      console.log('[Part2Form] Current Part 2 data:', part2Data);
      
      // If we have responses but completion is false, force mark as complete
      if (part2Data.hasData && part2Data.data?.responses && Object.keys(part2Data.data.responses).length >= 50) {
        console.log('[Part2Form] Force marking Part 2 as complete...');
        
        await AssessmentDatabaseService.updatePart2(user.id, progress.group_id, {
          completed: true,
          submitted_at: new Date().toISOString()
        });
        
        // Update local progress
        updateProgress({
          part2Complete: true
        });
        
        console.log('[Part2Form] Part 2 marked as complete');
        toast.success('Part 2 completion status updated!');
      }
    } catch (error) {
      console.error('[Part2Form] Error force refreshing Part 2 status:', error);
    }
  };

  // Memoize isSectionComplete
  const isSectionComplete = useCallback((sectionIndex: number) => {
    const section = part2Sections[sectionIndex];
    if (!section || !section.questions) return false;
    
    // Debug logging for section completion
    if (sectionIndex === 1) { // Section 2 (0-indexed)
      console.log('[Part2Form] Checking section 2 completion:', {
        sectionTitle: section.title,
        questionCount: section.questions.length,
        responses: responses
      });
    }
    
    if (sectionIndex === 10) { // Section 11 (0-indexed)
      console.log('[Part2Form] Checking section 11 completion:', {
        sectionTitle: section.title,
        questionCount: section.questions.length,
        responses: responses
      });
    }
    
    const result = section.questions.every(question => {
      const fieldName = question.fieldName || question.id;
      
      // For matrix questions, don't check the main field name - check individual items
      if (question.type === 'matrix' && (question as any).matrixItems && (question as any).matrixItems.length > 0) {
        // For matrix questions, check if all individual matrix items have responses
        const matrixComplete = (question as any).matrixItems.every((item: any) => {
          const itemResponse = responses[item.fieldName];
          const isValid = itemResponse !== undefined && itemResponse !== null && itemResponse !== '';
          
          // Debug logging for matrix items
          if (sectionIndex === 10) {
            console.log(`[Part2Form] Matrix item ${item.fieldName}:`, {
              response: itemResponse,
              isValid: isValid
            });
          }
          
          return isValid;
        });
        
        if (sectionIndex === 10) {
          console.log(`[Part2Form] Matrix question ${question.id} completion: ${matrixComplete}`);
        }
        
        return matrixComplete;
      }
      
      // For non-matrix questions, check the main field name
      const response = responses[fieldName];
      
      // Debug logging for each question in section 2
      if (sectionIndex === 1) {
        console.log(`[Part2Form] Question ${question.id} (${fieldName}):`, {
          type: question.type,
          response: response,
          hasResponse: response !== undefined && response !== null && response !== '',
          isArray: Array.isArray(response),
          arrayLength: Array.isArray(response) ? response.length : 'N/A',
          isString: typeof response === 'string',
          stringTrimmed: typeof response === 'string' ? response.trim() : 'N/A',
          hasMatrixItems: !!(question as any).matrixItems,
          matrixItemsCount: (question as any).matrixItems ? (question as any).matrixItems.length : 0,
          allMatrixResponses: (question as any).matrixItems ? 
            (question as any).matrixItems.map((item: any) => ({
              fieldName: item.fieldName,
              response: responses[item.fieldName],
              hasResponse: responses[item.fieldName] !== undefined && responses[item.fieldName] !== null && responses[item.fieldName] !== ''
            })) : []
        });
      }
      
      // Debug logging for each question in section 11
      if (sectionIndex === 10) {
        console.log(`[Part2Form] Question ${question.id} (${fieldName}):`, {
          type: question.type,
          response: response,
          hasResponse: response !== undefined && response !== null && response !== '',
          isArray: Array.isArray(response),
          arrayLength: Array.isArray(response) ? response.length : 'N/A',
          isString: typeof response === 'string',
          stringTrimmed: typeof response === 'string' ? response.trim() : 'N/A',
          hasMatrixItems: !!(question as any).matrixItems,
          matrixItemsCount: (question as any).matrixItems ? (question as any).matrixItems.length : 0,
          allMatrixResponses: (question as any).matrixItems ? 
            (question as any).matrixItems.map((item: any) => ({
              fieldName: item.fieldName,
              response: responses[item.fieldName],
              hasResponse: responses[item.fieldName] !== undefined && responses[item.fieldName] !== null && responses[item.fieldName] !== ''
            })) : []
        });
      }
      
      if (response === undefined || response === null || response === '') return false;
      if (Array.isArray(response) && response.length === 0) return false;
      if (typeof response === 'string' && response.trim() === '') return false;
      
      if (question.type === 'slider') return response !== undefined;
      
      return true;
    });
    
    if (sectionIndex === 1) {
      console.log(`[Part2Form] Section 2 completion result: ${result}`);
    }
    
    if (sectionIndex === 10) {
      console.log(`[Part2Form] Section 11 completion result: ${result}`);
    }
    
    return result;
  }, [responses]);

  // Progress calculations
  const completedSections = useMemo(() => {
    return part2Sections.filter((_, idx) => isSectionComplete(idx)).length;
  }, [isSectionComplete]);

  const progressPercentage = useMemo(() => {
    return Math.round((completedSections / part2Sections.length) * 100);
  }, [completedSections]);

  // Updated completion handler to ONLY use API for processing
  const handleComplete = async () => {
    
    if (!user?.id) {
      console.error('No user ID found!');
      toast.error('Authentication error', {
        description: 'Please sign in again.'
      });
      return;
    }

    setIsSubmitting(true);
    setIsPolling(false);
    setShowManualCheck(false);
    setSubmissionStage('Saving your responses...');
    
    try {
      // Step 1: Save ALL responses to Supabase using UID as primary identifier
      await AssessmentDatabaseService.savePart2(user.id, progress.group_id || '', responses);
      
      // Step 2: Call the API to trigger backend processing (still use group_id for API compatibility)
      setSubmissionStage('Processing your detailed assessment...');
      
      if (progress.group_id) {
        try {
          await AssessmentApiService.completeAssessment(progress.group_id);
        } catch (apiError) {
          console.error('API call failed:', apiError);
          // Don't throw - data is saved, just API processing failed
          toast.warning('Assessment saved but processing delayed. We\'ll complete it in the background.');
        }
      }
      
      // Step 3: Clear localStorage
      localStorage.removeItem('part2Responses');
      localStorage.removeItem('assessmentResponses');
      localStorage.removeItem('assessmentGroupId');
      
      // Step 4: Update local progress
      updateProgress({
        part2Complete: true,
        part2Answers: responses
      });
      
      // Step 5: Check if validation questions are needed
      setSubmissionStage('Checking if personalisation questions are needed...');
      
      try {
        const validationResponse = await fetch(`${import.meta.env.VITE_API_URL}/validation/check-need`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.id,  // Use UID instead of group_id
            group_id: progress.group_id,  // Keep for backward compatibility
            email: user.email,
            part1_answers: progress.part1Answers,
            part2_answers: responses
          })
        });

        if (validationResponse.ok) {
          const validationData = await validationResponse.json();
          
          if (validationData.needs_validation) {
            toast.success('Assessment Complete!', {
              description: 'Now let\'s personalize your roadmap with a few quick questions.',
              duration: 3000
            });
            
            // Set completion flags before navigation
            setIsSubmitting(false);
            setIsPolling(false);
            setSubmissionStage('');
            
            // Small delay to ensure modal closes before navigation
            setTimeout(() => {
              navigate('/validation-questions');
            }, 100);
            return;
          } else {
            toast.success('Assessment Complete!', {
              description: 'Proceeding to roadmap generation...',
              duration: 3000
            });
            
            // Set completion flags before navigation
            setIsSubmitting(false);
            setIsPolling(false);
            setSubmissionStage('');
            
            // Navigate directly to generation progress
            setTimeout(() => {
              navigate('/assessment/confirmation');
            }, 100);
            return;
          }
        } else {
          // Default to showing validation questions if check fails
          toast.success('Assessment Complete!', {
            description: 'Now let\'s personalize your roadmap with a few quick questions.',
            duration: 3000
          });
          
          // Set completion flags before navigation
          setIsSubmitting(false);
          setIsPolling(false);
          setSubmissionStage('');
          
          // Navigate to validation questions as default
          setTimeout(() => {
            navigate('/validation-questions');
          }, 100);
          return;
        }
      } catch (validationError) {
        console.error('Error checking validation need, defaulting to validation:', validationError);
        // Default to validation questions on error
        toast.success('Assessment Complete!', {
          description: 'Now let\'s personalize your roadmap with a few quick questions.',
          duration: 3000
        });
        
        // Set completion flags before navigation
        setIsSubmitting(false);
        setIsPolling(false);
        setSubmissionStage('');
        
        // Navigate to validation questions as default
        setTimeout(() => {
          navigate('/validation-questions');
        }, 100);
        return;
      }
      
    } catch (error) {
      console.error('Error completing assessment:', error);
      toast.error("Error", {
        description: "Failed to complete assessment. Please try again."
      });
      
      setShowManualCheck(true);
      // Only set flags if we haven't navigated
      setIsSubmitting(false);
      setIsPolling(false);
      setSubmissionStage('');
    }
  };

  // Show loading state while progress is being loaded
  if (loading || !isInitialized) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading assessment...</span>
      </div>
    );
  }

  // Show warning if Part 1 is not complete
  if (!progress.part1Complete) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            You need to complete Part 1 of the assessment before proceeding with Part 2. 
            <Button 
              variant="link" 
              className="p-0 h-auto text-orange-600 underline ml-1"
              onClick={() => navigate('/assessment/part1')}
            >
              Go to Part 1
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Render progress bar
  // Regular component for Progress Bar (NOT useCallback)
  const ProgressBar = () => {
    return (
      <div 
        className="bg-white rounded-lg shadow-lg overflow-hidden sticky top-0 z-50"
        style={{
          marginBottom: '24px',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}
      >
        {/* Overall Progress Section */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Part 2: Detailed Assessment</h2>
              <span className="text-sm text-gray-500">
                {lastSaved && `Last saved: ${new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-lg text-gray-600">
                {progressPercentage}% complete
              </span>
            </div>
            
            {/* Custom Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            
            {/* Section Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Section Progress</span>
                <span className="text-sm text-gray-600">
                  {completedSections} of {part2Sections.length} complete
                </span>
              </div>
              
              <div className="flex gap-1">
                {part2Sections.map((section, idx) => {
                  const isCompleted = isSectionComplete(idx) && Object.keys(responses || {}).length > 0;
                  const isCurrent = idx === currentSectionIndex;
                  const isAccessible = isCompleted || idx <= currentSectionIndex;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => !isSubmitting && isAccessible && handleSectionChange(idx)}
                      disabled={isSubmitting || !isAccessible}
                      className={`
                        flex-1 h-2 rounded-full transition-all 
                        ${isCompleted
                          ? 'bg-green-500'
                          : isCurrent
                            ? 'bg-blue-500'
                            : 'bg-gray-300'
                        }
                        ${isAccessible ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-50'}
                      `}
                      title={`${section.shortTitle || section.title}: ${
                        isCompleted ? 'Complete - Click to view' : isCurrent ? 'In Progress' : isAccessible ? 'Available' : 'Not Started'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
            
            {/* Section Navigation Bar */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Jump to Section</span>
                <span className="text-xs text-gray-500">Click any section to navigate</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {part2Sections.map((section, idx) => {
                  const isCompleted = isSectionComplete(idx);
                  const isCurrent = idx === currentSectionIndex;
                  const isAccessible = isCompleted || idx <= currentSectionIndex;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => !isSubmitting && isAccessible && handleSectionChange(idx)}
                      disabled={isSubmitting || !isAccessible}
                      className={`
                        p-2 text-xs rounded-md transition-all border
                        ${isCurrent
                          ? 'bg-blue-500 text-white border-blue-500'
                          : isCompleted
                            ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200'
                            : isAccessible
                              ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                              : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        }
                      `}
                      title={`${section.title}: ${
                        isCompleted ? 'Complete - Click to view' : isCurrent ? 'Current' : isAccessible ? 'Available' : 'Locked'
                      }`}
                    >
                      <div className="font-medium">{idx + 1}</div>
                      <div className="truncate">{section.shortTitle}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        
        {/* Current Section Header */}
        <div className="bg-purple-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium opacity-90">
              Section {currentSectionIndex + 1} of {part2Sections.length}
            </span>
            <ArrowRight className="h-4 w-4 opacity-60" />
          </div>
          <div className="text-2xl font-bold text-right">
            {Math.round((isSectionComplete(currentSectionIndex) ? 100 : 0))}%
            <div className="text-sm font-normal opacity-90">complete</div>
          </div>
        </div>
        
        {/* Section Title Bar */}
        <div className="bg-purple-500 text-white px-6 py-4">
          <h2 className="text-2xl font-bold">{currentSection.title}</h2>
          <p className="text-purple-100 mt-1">{currentSection.description}</p>
        </div>
      </div>
    );
  };

  // Regular component for Navigation (NOT useCallback)
  const NavigationBar = () => {
    return (
      <div 
        className="bg-white border-t border-gray-200 p-4 sticky bottom-0 z-40"
        style={{
          marginTop: '24px',
          position: 'sticky',
          bottom: 0,
          zIndex: 40
        }}
      >
        <div className="flex justify-between items-center gap-4 max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={() => handleSectionChange(currentSectionIndex - 1)}
            disabled={currentSectionIndex === 0 || isSubmitting}
            className="w-32"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleManualSave}
              disabled={isSubmitting}
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Progress
            </Button>
            
            <Button
              variant="outline"
              onClick={forceRefreshPart2Status}
              disabled={isSubmitting}
              size="sm"
              title="Force refresh Part 2 completion status"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Fix Status
            </Button>
          </div>

          {currentSectionIndex === part2Sections.length - 1 ? (
            <Button
              onClick={handleComplete}
              disabled={!isSectionComplete(currentSectionIndex) || isSubmitting}
              className="w-32 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Complete
                  <CheckCircle className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => handleSectionChange(currentSectionIndex + 1)}
              disabled={!isSectionComplete(currentSectionIndex) || isSubmitting}
              className="w-32"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    );
  };



  // FIX 5: Early return if no current section
  if (!currentSection) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading section...</span>
      </div>
    );
  }

  // Render individual question based on type
  const renderQuestion = (question: any, qIndex: number) => {
    const fieldName = String(question.fieldName || question.id);
    const value = responses[fieldName];

    return (
      <div key={`${currentSectionIndex}-${fieldName}`} className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <label className="text-lg font-semibold text-gray-900 leading-relaxed">
              {qIndex + 1}. {question.question}
              {question.required && <span className="text-red-600 ml-1">*</span>}
            </label>
          </div>
          
          {question.description && (
            <p className="text-gray-600 text-sm leading-relaxed">
              {question.description}
            </p>
          )}

          {question.helperText && (
            <p className="text-xs text-gray-500 mt-2">{question.helperText}</p>
          )}

          {/* Render question input based on type */}
          {question.type === 'text' && (
            <Input
              value={value || ''}
              onChange={(e) => handleResponseChange(fieldName, e.target.value)}
              placeholder="Your answer..."
              className="border-gray-300 focus:border-teal-600 focus:ring-teal-600 text-gray-900 placeholder:text-gray-500"
            />
          )}

          {question.type === 'textarea' && (
            <Textarea
              value={value || ''}
              onChange={(e) => handleResponseChange(fieldName, e.target.value)}
              placeholder="Your answer..."
              className="min-h-[100px] border-gray-300 focus:border-teal-600 focus:ring-teal-600 text-gray-900 placeholder:text-gray-500 resize-vertical"
            />
          )}

          {question.type === 'radio' && (
            <div className="space-y-2">
              {question.options?.map((option) => {
                const isSelected = value === option;
                return (
                  <label
                    key={option}
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all border-2 ${
                      isSelected
                        ? 'bg-teal-50 text-teal-900 border-teal-500'
                        : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-300 hover:border-teal-300'
                    }`}
                    onClick={() => handleResponseChange(fieldName, option)}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? 'border-teal-600 bg-teal-600'
                        : 'border-gray-400'
                    }`}>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <span className="text-sm">{option}</span>
                  </label>
                );
              })}
            </div>
          )}

          {question.type === 'checkbox' && (
            <div className="space-y-2">
              {question.options?.map((option) => {
                const currentValues = value || [];
                const isChecked = currentValues.includes(option);
                
                return (
                  <label
                    key={option}
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all border-2 ${
                      isChecked
                        ? 'bg-teal-50 text-teal-900 border-teal-500'
                        : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-300 hover:border-teal-300'
                    }`}
                    onClick={() => {
                      const newValues = isChecked
                        ? currentValues.filter((v: string) => v !== option)
                        : [...currentValues, option];
                      handleResponseChange(fieldName, newValues);
                    }}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      isChecked
                        ? 'border-teal-600 bg-teal-600'
                        : 'border-gray-400'
                    }`}>
                      {isChecked && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className="text-sm">{option}</span>
                  </label>
                );
              })}
            </div>
          )}

          {question.type === 'select' && (
            <Select value={value || ''} onValueChange={(val) => handleResponseChange(fieldName, val)}>
              <SelectTrigger className="border-gray-300 focus:border-teal-600 focus:ring-teal-600">
                <SelectValue placeholder="Select an option..." />
              </SelectTrigger>
              <SelectContent>
                {question.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {question.type === 'slider' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{question.min || 0}</span>
                <span>{value || question.min || 0}</span>
                <span>{question.max || 100}</span>
              </div>
              <input
                type="range"
                min={question.min || 0}
                max={question.max || 100}
                value={value || question.min || 0}
                onChange={(e) => handleResponseChange(fieldName, parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          )}

          {question.type === 'matrix' && question.matrixItems && (
            <div className="space-y-3">
              {question.matrixItems.map((item, itemIndex) => (
                <div key={item.fieldName} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => handleResponseChange(item.fieldName, rating)}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-all ${
                          responses[item.fieldName] === rating
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-teal-300 hover:bg-teal-50'
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {question.type === 'conditional' && question.conditionalQuestions && (
            <div className="space-y-3">
              {/* Main question radio buttons */}
              <div className="space-y-2">
                {question.options?.map((option) => {
                  const isSelected = value === option;
                  return (
                    <label
                      key={option}
                      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all border-2 ${
                        isSelected
                          ? 'bg-teal-50 text-teal-900 border-teal-500'
                          : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-300 hover:border-teal-300'
                      }`}
                      onClick={() => handleResponseChange(fieldName, option)}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-teal-600 bg-teal-600'
                          : 'border-gray-400'
                      }`}>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <span className="text-sm">{option}</span>
                    </label>
                  );
                })}
              </div>
              
              {/* Conditional sub-questions */}
              {question.conditionalQuestions
                .filter(sq => sq.showWhen === value)
                .map((subQuestion, subIndex) => (
                  <div key={subQuestion.id} className="ml-6 p-4 border-l-2 border-teal-200 bg-teal-50 rounded-r-lg">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      {subQuestion.question}
                    </label>
                    {subQuestion.type === 'text' && (
                      <Input
                        value={responses[subQuestion.fieldName] || ''}
                        onChange={(e) => handleResponseChange(subQuestion.fieldName, e.target.value)}
                        placeholder="Your answer..."
                        className="border-gray-300 focus:border-teal-600 focus:ring-teal-600"
                      />
                    )}
                    {subQuestion.type === 'radio' && subQuestion.options && (
                      <div className="space-y-2">
                        {subQuestion.options.map((option) => (
                          <label
                            key={option}
                            className={`flex items-center space-x-3 p-2 rounded cursor-pointer transition-all ${
                              responses[subQuestion.fieldName] === option
                                ? 'bg-teal-100 text-teal-900'
                                : 'bg-white hover:bg-gray-50'
                            }`}
                            onClick={() => handleResponseChange(subQuestion.fieldName, option)}
                          >
                            <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                              responses[subQuestion.fieldName] === option
                                ? 'border-teal-600 bg-teal-600'
                                : 'border-gray-400'
                            }`}>
                              {responses[subQuestion.fieldName] === option && (
                                <div className="w-1 h-1 rounded-full bg-white"></div>
                              )}
                            </div>
                            <span className="text-sm">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    
                    {subQuestion.type === 'number' && (
                      <Input
                        type="number"
                        value={responses[subQuestion.fieldName] || ''}
                        onChange={(e) => handleResponseChange(subQuestion.fieldName, parseInt(e.target.value) || '')}
                        placeholder="Enter number..."
                        className="border-gray-300 focus:border-teal-600 focus:ring-teal-600"
                      />
                    )}
                    
                    {subQuestion.type === 'checkbox' && subQuestion.options && (
                      <div className="space-y-2">
                        {subQuestion.options.map((option) => {
                          const currentValues = responses[subQuestion.fieldName] || [];
                          const isChecked = currentValues.includes(option);
                          
                          return (
                            <label
                              key={option}
                              className={`flex items-center space-x-3 p-2 rounded cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-teal-100 text-teal-900'
                                  : 'bg-white hover:bg-gray-50'
                              }`}
                              onClick={() => {
                                const newValues = isChecked
                                  ? currentValues.filter((v: string) => v !== option)
                                  : [...currentValues, option];
                                handleResponseChange(subQuestion.fieldName, newValues);
                              }}
                            >
                              <div className={`w-3 h-3 rounded border-2 flex items-center justify-center ${
                                isChecked
                                  ? 'border-teal-600 bg-teal-600'
                                  : 'border-gray-400'
                              }`}>
                                {isChecked && (
                                  <Check className="w-2 h-2 text-white" />
                                )}
                              </div>
                              <span className="text-sm">{option}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundColor: '#f8fafc',
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e2e8f0' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2V6h4V4H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}
    >
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Render components, not function calls */}
        <ProgressBar />
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 space-y-6">
            {currentSection.questions?.map((question, qIndex) => renderQuestion(question, qIndex))}
          </div>
        </div>
        
        <NavigationBar />
      </div>

      {/* Submission modal */}
      {isSubmitting && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-teal-600" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Completing Assessment
              </h3>
              <p className="text-gray-600 mb-4">{submissionStage}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-300 ease-out"
                  style={{ width: `${pollingProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Manual check modal */}
      {showManualCheck && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Assessment Processing
              </h3>
              <p className="text-gray-600 mb-4">
                Your assessment is being processed. This may take a few minutes.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleManualCheck}
                  disabled={isPolling}
                  className="flex-1"
                >
                  {isPolling ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Check Status
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowManualCheck(false)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};