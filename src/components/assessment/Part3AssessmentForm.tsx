import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssessmentProgress } from '@/hooks/useAssessmentProgress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export const Part3AssessmentForm = () => {
  const { user } = useAuth();
  const { progress } = useAssessmentProgress();
  const navigate = useNavigate();
  
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dynamicQuestions, setDynamicQuestions] = useState<any[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [businessStage, setBusinessStage] = useState<string>('');

  // Load dynamic questions from backend
  useEffect(() => {
    const loadDynamicQuestions = async () => {
      if (!user?.id || !progress?.group_id) return;

      try {
        setQuestionsLoading(true);
        console.log('Loading dynamic questions for group:', progress.group_id);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          console.error('No session token available');
          return;
        }

        const apiUrl = import.meta.env.VITE_API_URL || 'https://oracle-api-server-production.up.railway.app';

        const response = await fetch(`${apiUrl}/api/get-part3-questions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            group_id: progress.group_id,
            user_id: user.id
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Dynamic questions loaded:', result);

          if (result.status === 'success' && result.questions) {
            setDynamicQuestions(result.questions);
            setBusinessStage(result.business_stage || 'unknown');
            console.log('Using dynamic questions for stage:', result.business_stage);
          } else {
            console.log('No dynamic questions available');
            setDynamicQuestions([]);
          }
        } else {
          console.log('Failed to load dynamic questions');
          setDynamicQuestions([]);
        }
      } catch (error) {
        console.error('Error loading dynamic questions:', error);
        setDynamicQuestions([]);
      } finally {
        setQuestionsLoading(false);
      }
    };

    loadDynamicQuestions();
  }, [user?.id, progress?.group_id]);

  // Load existing responses if available
  useEffect(() => {
    const loadExistingResponses = async () => {
      if (!progress?.group_id) return;

      try {
        // Check for existing Part 3 data in Part 2 table
        const { data: part2Data } = await supabase
          .from('client_intake_part2')
          .select('part3_data')
          .eq('group_id', progress.group_id)
          .single();

        if (part2Data?.part3_data && Object.keys(part2Data.part3_data).length > 0) {
          console.log('Loaded existing Part 3 responses:', Object.keys(part2Data.part3_data).length);
          setResponses(part2Data.part3_data);
        }
      } catch (error) {
        console.log('No existing Part 3 responses found');
      }
    };

    loadExistingResponses();
  }, [progress?.group_id]);

  const handleSectionChange = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < dynamicQuestions.length) {
      setCurrentSectionIndex(newIndex);
    }
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleComplete = async () => {
    if (!user?.id || !progress?.group_id) return;

    setIsSubmitting(true);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 30000)
    );

    const completionPromise = (async () => {
      console.log('[Part3AssessmentForm] Starting completion process...');
      
      // Step 2: Save Part 3 responses
      console.log('[Part3AssessmentForm] Saving Part 3 responses...');
      console.log('[Part3AssessmentForm] Group ID:', progress.group_id);
      console.log('[Part3AssessmentForm] Response count:', Object.keys(responses).length);
      
      const saveResult = await supabase
        .from('client_intake_part2')
        .update({
          part3_data: responses,
          part3_complete: true,
          part3_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('group_id', progress.group_id);
      
      console.log('[Part3AssessmentForm] Save result:', saveResult);
      
      if (saveResult.error) {
        console.error('[Part3AssessmentForm] Database save error:', saveResult.error);
        throw new Error(`Failed to save responses: ${saveResult.error.message}`);
      }
      
      console.log('[Part3AssessmentForm] Part 3 responses saved successfully');
      
      // Step 2: Update completion status (only if table exists)
      console.log('[Part3AssessmentForm] Updating completion status...');
      try {
        const statusResult = await supabase
          .from('client_config')
          .update({
            updated_at: new Date().toISOString()
          })
          .eq('group_id', progress.group_id);
        
        if (statusResult.error) {
          console.error('[Part3AssessmentForm] Status update error:', statusResult.error);
          // Don't throw here - the data is saved, just the status update failed
        } else {
          console.log('[Part3AssessmentForm] Completion status updated');
        }
      } catch (error) {
        console.error('[Part3AssessmentForm] Could not update client_config:', error);
        // Continue without updating client_config
      }
      
      // Step 3: Generate value analysis
      console.log('[Part3AssessmentForm] Attempting to generate value analysis...');
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          console.error('[Part3AssessmentForm] No session token available');
          throw new Error('No session token available');
        }
        
        const apiUrl = import.meta.env.VITE_API_URL || 'https://oracle-api-server-production.up.railway.app';
        console.log('[Part3AssessmentForm] Using API URL:', apiUrl);
        console.log('[Part3AssessmentForm] Session token available:', !!session.access_token);
        
        const response = await fetch(`${apiUrl}/api/generate-value-analysis`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            group_id: progress.group_id,
            user_id: user?.id,
            part3_responses: responses
          }),
          // Add timeout configuration
          signal: AbortSignal.timeout(60000) // 60 second timeout
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Part3AssessmentForm] Value analysis generation failed:', response.status, errorText);
          throw new Error(`Value analysis generation failed: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('[Part3AssessmentForm] Value analysis generation successful:', result);
        console.log('[Part3AssessmentForm] Result structure:', {
          hasSummary: !!result.summary,
          hasData: !!result.data,
          keys: Object.keys(result),
          summaryKeys: result.summary ? Object.keys(result.summary) : [],
          dataKeys: result.data ? Object.keys(result.data) : []
        });
        
        // The backend already saves the value analysis data to the database
        // We don't need to save it again from the frontend
        console.log('[Part3AssessmentForm] Backend has already saved value analysis data');
        
        toast.success('Hidden Value Audit Complete!', {
          description: 'Your value analysis has been generated successfully.',
          duration: 5000
        });
        
        // Navigate to value analysis page
        navigate('/dashboard/value-analysis');
        
      } catch (error) {
        console.error('[Part3AssessmentForm] Error generating value analysis:', error);
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isTimeout = error instanceof Error && (error.name === 'TimeoutError' || errorMessage.includes('timeout'));
        
        if (isTimeout) {
          toast.error('Value Analysis Generation Timeout', {
            description: 'The analysis is taking longer than expected. Please try again in a few minutes.',
            duration: 8000
          });
        } else {
          toast.error('Value Analysis Generation Failed', {
            description: 'There was an error generating your value analysis. Please try again.',
            duration: 5000
          });
        }
        
        // Don't navigate away - let user try again
        return;
      }
    })();
    
    try {
      await Promise.race([completionPromise, timeoutPromise]);
    } catch (error) {
      console.error('[Part3AssessmentForm] Error completing Part 3:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to complete assessment: {errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSave = async () => {
    if (!progress?.group_id) return;

    try {
      const result = await supabase
        .from('client_intake_part2')
        .update({
          part3_data: responses,
          updated_at: new Date().toISOString()
        })
        .eq('group_id', progress.group_id);

      if (result.error) {
        toast.error('Failed to save responses');
      } else {
        toast.success('Responses saved successfully');
      }
    } catch (error) {
      toast.error('Failed to save responses');
    }
  };

  if (questionsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dynamic questions...</span>
      </div>
    );
  }

  if (dynamicQuestions.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Dynamic Questions Available</h2>
          <p className="text-gray-600 mb-4">Unable to load stage-specific questions. Please try again.</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  const currentSection = dynamicQuestions[currentSectionIndex];
  const totalSections = dynamicQuestions.length;
  const progressPercentage = ((currentSectionIndex + 1) / totalSections) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Hidden Value Audit</h1>
        <p className="text-gray-600">Complete this assessment to unlock your business's hidden value</p>
      </div>

      {/* Dynamic Questions Indicator */}
      {businessStage && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="text-sm text-blue-700">
            🎯 Using dynamic questions for <strong>{businessStage}</strong> stage
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Section {currentSectionIndex + 1} of {totalSections}</span>
          <span>{Math.round(progressPercentage)}% Complete</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Current Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{currentSection.section}</CardTitle>
        </CardHeader>
        <CardContent>
          {currentSection.questions.map((question: any) => (
            <div key={question.id} className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {question.question}
              </label>
              
              {question.type === 'radio' && (
                <div className="space-y-2">
                  {question.options.map((option: string) => (
                    <label key={option} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name={question.fieldName}
                        value={option}
                        checked={responses[question.fieldName] === option}
                        onChange={(e) => handleAnswerChange(question.fieldName, e.target.value)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              )}
              
              {question.type === 'checkbox' && (
                <div className="space-y-2">
                  {question.options.map((option: string) => (
                    <label key={option} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={responses[question.fieldName]?.includes(option) || false}
                        onChange={(e) => {
                          const currentValues = responses[question.fieldName] || [];
                          const newValues = e.target.checked
                            ? [...currentValues, option]
                            : currentValues.filter((v: string) => v !== option);
                          handleAnswerChange(question.fieldName, newValues);
                        }}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              )}
              
              {question.type === 'text' && (
                <textarea
                  value={responses[question.fieldName] || ''}
                  onChange={(e) => handleAnswerChange(question.fieldName, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter your response..."
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => handleSectionChange(currentSectionIndex - 1)}
          disabled={currentSectionIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleManualSave}>
            Save Progress
          </Button>
          
          {currentSectionIndex === totalSections - 1 ? (
            <Button onClick={handleComplete} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Assessment
                </>
              )}
            </Button>
          ) : (
            <Button onClick={() => handleSectionChange(currentSectionIndex + 1)}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}; 